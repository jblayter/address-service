#!/bin/bash
VPC_ID="vpc-07af208066715e4e0"

echo "Cleaning up VPC: $VPC_ID"

# Delete NAT gateways
echo "Deleting NAT gateways..."
NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --query 'NatGateways[?VpcId==`'$VPC_ID'`].NatGatewayId' --output text 2>/dev/null)

if [ -z "$NAT_GATEWAYS" ]; then
    echo "No NAT gateways found to delete"
else
    echo "Found NAT gateways: $NAT_GATEWAYS"
    for nat in $NAT_GATEWAYS; do
        echo "Deleting NAT gateway: $nat"
        aws ec2 delete-nat-gateway --nat-gateway-id $nat
        if [ $? -ne 0 ]; then
            echo "Failed to delete NAT gateway: $nat"
        fi
    done

    # Wait for NAT gateways to be deleted with timeout (macOS compatible)
    echo "Waiting for NAT gateways to be deleted (timeout: 10 minutes)..."
    for i in {1..60}; do
        REMAINING_NATS=$(aws ec2 describe-nat-gateways --nat-gateway-ids $NAT_GATEWAYS --query 'NatGateways[?State!=`deleted`].NatGatewayId' --output text 2>/dev/null)
        if [ -z "$REMAINING_NATS" ]; then
            echo "NAT gateways deleted successfully"
            break
        fi
        echo "Waiting for NAT gateways to be deleted... ($i/60)"
        sleep 10
    done
    if [ $i -eq 60 ]; then
        echo "Timeout waiting for NAT gateways to be deleted. Continuing anyway..."
    fi
fi

# Also check for any NAT gateways by looking at network interface descriptions
echo "Checking for NAT gateways via network interfaces..."
NAT_ENIS=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" "Name=description,Values=*NAT Gateway*" --query 'NetworkInterfaces[].NetworkInterfaceId' --output text 2>/dev/null)
if [ ! -z "$NAT_ENIS" ]; then
    echo "Found NAT Gateway network interfaces: $NAT_ENIS"
    for eni in $NAT_ENIS; do
        echo "Getting NAT Gateway ID from network interface: $eni"
        NAT_ID=$(aws ec2 describe-network-interfaces --network-interface-ids $eni --query 'NetworkInterfaces[0].Description' --output text 2>/dev/null | grep -o 'nat-[a-z0-9]*' || echo "")
        if [ ! -z "$NAT_ID" ]; then
            echo "Deleting NAT Gateway: $NAT_ID"
            aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
        fi
    done
fi

# Force delete the specific NAT gateway we know exists
echo "Force deleting known NAT gateway: nat-036b1532b4c014c47"
aws ec2 delete-nat-gateway --nat-gateway-id nat-036b1532b4c014c47 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Successfully initiated deletion of NAT gateway nat-036b1532b4c014c47"
    echo "Waiting for NAT gateway to be deleted..."
    for i in {1..30}; do
        NAT_STATUS=$(aws ec2 describe-nat-gateways --nat-gateway-ids nat-036b1532b4c014c47 --query 'NatGateways[0].State' --output text 2>/dev/null)
        if [ "$NAT_STATUS" = "deleted" ] || [ "$NAT_STATUS" = "None" ]; then
            echo "NAT gateway deleted successfully"
            break
        fi
        echo "Waiting for NAT gateway deletion... ($i/30)"
        sleep 10
    done
    if [ $i -eq 30 ]; then
        echo "Timeout waiting for NAT gateway deletion, but continuing..."
    fi
else
    echo "NAT gateway nat-036b1532b4c014c47 not found or already deleted"
fi

# Terminate EC2 instances in the VPC
echo "Terminating EC2 instances..."
INSTANCES=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" "Name=instance-state-name,Values=running,stopped,pending,stopping" --query 'Reservations[].Instances[].InstanceId' --output text 2>/dev/null)
if [ ! -z "$INSTANCES" ]; then
    echo "Found instances: $INSTANCES"
    aws ec2 terminate-instances --instance-ids $INSTANCES
    echo "Waiting for instances to terminate..."
    aws ec2 wait instance-terminated --instance-ids $INSTANCES
else
    echo "No EC2 instances found"
fi

# Delete load balancers (ALB/NLB)
echo "Deleting load balancers..."
ALBS=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?VpcId==`'$VPC_ID'`].LoadBalancerArn' --output text 2>/dev/null)
if [ ! -z "$ALBS" ]; then
    echo "Found load balancers: $ALBS"
    for alb in $ALBS; do
        echo "Deleting load balancer: $alb"
        aws elbv2 delete-load-balancer --load-balancer-arn $alb
    done
else
    echo "No load balancers found"
fi

# Delete Classic Load Balancers (ELB)
echo "Deleting Classic Load Balancers..."
ELBS=$(aws elb describe-load-balancers --query 'LoadBalancerDescriptions[?VPCId==`'$VPC_ID'`].LoadBalancerName' --output text 2>/dev/null)
if [ ! -z "$ELBS" ]; then
    echo "Found Classic Load Balancers: $ELBS"
    for elb in $ELBS; do
        echo "Deleting Classic Load Balancer: $elb"
        aws elb delete-load-balancer --load-balancer-name $elb
    done
else
    echo "No Classic Load Balancers found"
fi

# Delete ECS services
echo "Checking ECS services..."
ECS_CLUSTERS=$(aws ecs list-clusters --query 'clusterArns' --output text 2>/dev/null)
if [ ! -z "$ECS_CLUSTERS" ]; then
    for cluster in $ECS_CLUSTERS; do
        ECS_SERVICES=$(aws ecs list-services --cluster $cluster --query 'serviceArns' --output text 2>/dev/null)
        if [ ! -z "$ECS_SERVICES" ]; then
            echo "Found ECS services in cluster $cluster: $ECS_SERVICES"
            for service in $ECS_SERVICES; do
                echo "Scaling down ECS service: $service"
                aws ecs update-service --cluster $cluster --service $service --desired-count 0
            done
            echo "Deleting ECS services in cluster $cluster"
            aws ecs delete-services --cluster $cluster --services $ECS_SERVICES --force
        fi
    done
else
    echo "No ECS clusters found"
fi

# Delete EKS clusters
echo "Checking EKS clusters..."
EKS_CLUSTERS=$(aws eks list-clusters --query 'clusters' --output text 2>/dev/null)
if [ ! -z "$EKS_CLUSTERS" ]; then
    for cluster in $EKS_CLUSTERS; do
        VPC_ID_CHECK=$(aws eks describe-cluster --name $cluster --query 'cluster.resourcesVpcConfig.vpcId' --output text 2>/dev/null)
        if [ "$VPC_ID_CHECK" = "$VPC_ID" ]; then
            echo "Found EKS cluster using VPC: $cluster"
            echo "Deleting EKS cluster: $cluster"
            aws eks delete-cluster --name $cluster
        fi
    done
else
    echo "No EKS clusters found"
fi

# Delete RDS instances
echo "Deleting RDS instances..."
RDS_INSTANCES=$(aws rds describe-db-instances --query 'DBInstances[?DBSubnetGroup.VpcId==`'$VPC_ID'`].DBInstanceIdentifier' --output text 2>/dev/null)
if [ ! -z "$RDS_INSTANCES" ]; then
    echo "Found RDS instances: $RDS_INSTANCES"
    for rds in $RDS_INSTANCES; do
        echo "Deleting RDS instance: $rds"
        aws rds delete-db-instance --db-instance-identifier $rds --skip-final-snapshot --delete-automated-backups
    done
else
    echo "No RDS instances found"
fi

# Delete ElastiCache clusters
echo "Deleting ElastiCache clusters..."
CACHE_CLUSTERS=$(aws elasticache describe-cache-clusters --query 'CacheClusters[?CacheSubnetGroup.VpcId==`'$VPC_ID'`].CacheClusterId' --output text 2>/dev/null)
if [ ! -z "$CACHE_CLUSTERS" ]; then
    echo "Found ElastiCache clusters: $CACHE_CLUSTERS"
    for cache in $CACHE_CLUSTERS; do
        echo "Deleting ElastiCache cluster: $cache"
        aws elasticache delete-cache-cluster --cache-cluster-id $cache --final-snapshot-identifier "${cache}-final-snapshot"
    done
else
    echo "No ElastiCache clusters found"
fi

# Delete Redshift clusters
echo "Deleting Redshift clusters..."
REDSHIFT_CLUSTERS=$(aws redshift describe-clusters --query 'Clusters[?VpcId==`'$VPC_ID'`].ClusterIdentifier' --output text 2>/dev/null)
if [ ! -z "$REDSHIFT_CLUSTERS" ]; then
    echo "Found Redshift clusters: $REDSHIFT_CLUSTERS"
    for redshift in $REDSHIFT_CLUSTERS; do
        echo "Deleting Redshift cluster: $redshift"
        aws redshift delete-cluster --cluster-identifier $redshift --skip-final-cluster-snapshot
    done
else
    echo "No Redshift clusters found"
fi

# Delete Lambda functions that might be using the VPC
echo "Checking Lambda functions..."
LAMBDA_FUNCTIONS=$(aws lambda list-functions --query 'Functions[?VpcConfig.VpcId==`'$VPC_ID'`].FunctionName' --output text 2>/dev/null)
if [ ! -z "$LAMBDA_FUNCTIONS" ]; then
    echo "Found Lambda functions using VPC: $LAMBDA_FUNCTIONS"
    for func in $LAMBDA_FUNCTIONS; do
        echo "Removing VPC configuration from Lambda: $func"
        aws lambda update-function-configuration --function-name $func --vpc-config SubnetIds=[],SecurityGroupIds=[]
    done
else
    echo "No Lambda functions using VPC found"
fi

# Wait a bit for resources to be fully deleted
echo "Waiting for resources to be fully deleted..."
sleep 30

# Additional wait for NAT gateway network interfaces to be released
echo "Waiting for NAT gateway network interfaces to be released..."
sleep 60

# Delete network interfaces with retry logic
echo "Deleting network interfaces..."
ENIS=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[].NetworkInterfaceId' --output text 2>/dev/null)
if [ ! -z "$ENIS" ]; then
    echo "Found network interfaces: $ENIS"
    for eni in $ENIS; do
        echo "Attempting to delete network interface: $eni"
        # Check if it's a NAT gateway interface
        ENI_DESC=$(aws ec2 describe-network-interfaces --network-interface-ids $eni --query 'NetworkInterfaces[0].Description' --output text 2>/dev/null)
        if [[ "$ENI_DESC" == *"NAT Gateway"* ]]; then
            echo "This is a NAT Gateway interface, waiting longer for it to be released..."
            sleep 30
        fi
        
        # Try to detach first if attached
        ATTACHMENT_ID=$(aws ec2 describe-network-interfaces --network-interface-ids $eni --query 'NetworkInterfaces[0].Attachment.AttachmentId' --output text 2>/dev/null)
        if [ ! -z "$ATTACHMENT_ID" ] && [ "$ATTACHMENT_ID" != "None" ]; then
            echo "Detaching network interface: $eni"
            aws ec2 detach-network-interface --attachment-id $ATTACHMENT_ID --force
            sleep 10
        fi
        
        # Now try to delete
        aws ec2 delete-network-interface --network-interface-id $eni
        if [ $? -ne 0 ]; then
            echo "Failed to delete network interface: $eni (will retry later)"
        else
            echo "Successfully deleted network interface: $eni"
        fi
    done
else
    echo "No network interfaces found"
fi

# Delete elastic IPs associated with the VPC (with permission check)
echo "Deleting elastic IPs..."
EIPS=$(aws ec2 describe-addresses --query 'Addresses[?AssociationId!=null].AllocationId' --output text 2>/dev/null)
if [ ! -z "$EIPS" ]; then
    echo "Found elastic IPs: $EIPS"
    for eip in $EIPS; do
        echo "Attempting to release elastic IP: $eip"
        aws ec2 release-address --allocation-id $eip
        if [ $? -ne 0 ]; then
            echo "Failed to release elastic IP: $eip (permission issue or still in use)"
        fi
    done
else
    echo "No elastic IPs found"
fi

# Try to delete network interfaces again after other cleanup
echo "Retrying network interface deletion..."
ENIS_REMAINING=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[].NetworkInterfaceId' --output text 2>/dev/null)
if [ ! -z "$ENIS_REMAINING" ]; then
    echo "Remaining network interfaces: $ENIS_REMAINING"
    for eni in $ENIS_REMAINING; do
        echo "Final attempt to delete network interface: $eni"
        aws ec2 delete-network-interface --network-interface-id $eni --force 2>/dev/null
    done
fi

# Delete subnets
echo "Deleting subnets..."
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text)
for subnet in $SUBNETS; do
    echo "Deleting subnet: $subnet"
    aws ec2 delete-subnet --subnet-id $subnet
    if [ $? -ne 0 ]; then
        echo "Failed to delete subnet: $subnet (may have dependencies)"
    fi
done

# Delete route table associations
echo "Deleting route table associations..."
ASSOCIATIONS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[].Associations[?!Main][].RouteTableAssociationId' --output text)
for assoc in $ASSOCIATIONS; do
    echo "Deleting association: $assoc"
    aws ec2 disassociate-route-table --association-id $assoc
done

# Delete route tables (except main)
echo "Deleting route tables..."
ROUTE_TABLES=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?!Associations[0].Main][].RouteTableId' --output text)
for rt in $ROUTE_TABLES; do
    echo "Deleting route table: $rt"
    aws ec2 delete-route-table --route-table-id $rt
done

# Delete internet gateway
echo "Deleting internet gateway..."
IGW=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[].InternetGatewayId' --output text)
if [ ! -z "$IGW" ]; then
    echo "Detaching and deleting IGW: $IGW"
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC_ID
    if [ $? -ne 0 ]; then
        echo "Failed to detach IGW, trying to force cleanup..."
        # Try to delete any remaining dependencies
        aws ec2 describe-internet-gateways --internet-gateway-ids $IGW --query 'InternetGateways[].Attachments[].State' --output text
    fi
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW
    if [ $? -ne 0 ]; then
        echo "Failed to delete IGW: $IGW"
    fi
fi

# Delete security groups (except default)
echo "Deleting security groups..."
SGS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text)
for sg in $SGS; do
    echo "Deleting security group: $sg"
    aws ec2 delete-security-group --group-id $sg
    if [ $? -ne 0 ]; then
        echo "Failed to delete security group: $sg (may have dependencies)"
    fi
done

# Finally delete the VPC
echo "Deleting VPC: $VPC_ID"
aws ec2 delete-vpc --vpc-id $VPC_ID
if [ $? -ne 0 ]; then
    echo "Failed to delete VPC. Checking for remaining dependencies..."
    echo "Remaining resources in VPC:"
    aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" --query 'Reservations[].Instances[].InstanceId' --output text
    aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[].NetworkInterfaceId' --output text
    aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[].GroupId' --output text
    aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text
    
    echo ""
    echo "Detailed network interface information:"
    ENIS_DETAILED=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[].{NetworkInterfaceId:NetworkInterfaceId,Status:Status,Description:Description,Attachment:Attachment.AttachmentId,InstanceId:Attachment.InstanceId}' --output table 2>/dev/null)
    if [ ! -z "$ENIS_DETAILED" ]; then
        echo "$ENIS_DETAILED"
    fi
    
    echo ""
    echo "Checking for additional AWS services that might be using the VPC:"
    
    # Check for remaining load balancers
    echo "Remaining ALB/NLB:"
    aws elbv2 describe-load-balancers --query 'LoadBalancers[?VpcId==`'$VPC_ID'`].LoadBalancerArn' --output text 2>/dev/null
    
    echo "Remaining Classic ELB:"
    aws elb describe-load-balancers --query 'LoadBalancerDescriptions[?VPCId==`'$VPC_ID'`].LoadBalancerName' --output text 2>/dev/null
    
    # Check for remaining RDS
    echo "Remaining RDS instances:"
    aws rds describe-db-instances --query 'DBInstances[?DBSubnetGroup.VpcId==`'$VPC_ID'`].DBInstanceIdentifier' --output text 2>/dev/null
    
    # Check for remaining ElastiCache
    echo "Remaining ElastiCache clusters:"
    aws elasticache describe-cache-clusters --query 'CacheClusters[?CacheSubnetGroup.VpcId==`'$VPC_ID'`].CacheClusterId' --output text 2>/dev/null
    
    # Check for remaining Redshift
    echo "Remaining Redshift clusters:"
    aws redshift describe-clusters --query 'Clusters[?VpcId==`'$VPC_ID'`].ClusterIdentifier' --output text 2>/dev/null
    
    # Check for remaining EKS clusters
    echo "Remaining EKS clusters:"
    EKS_CLUSTERS_REMAINING=$(aws eks list-clusters --query 'clusters' --output text 2>/dev/null)
    if [ ! -z "$EKS_CLUSTERS_REMAINING" ]; then
        for cluster in $EKS_CLUSTERS_REMAINING; do
            VPC_ID_CHECK=$(aws eks describe-cluster --name $cluster --query 'cluster.resourcesVpcConfig.vpcId' --output text 2>/dev/null)
            if [ "$VPC_ID_CHECK" = "$VPC_ID" ]; then
                echo "$cluster"
            fi
        done
    fi
    
    echo ""
    echo "Manual cleanup may be required for the above resources."
else
    echo "VPC deleted successfully!"
fi

echo "VPC cleanup complete!"