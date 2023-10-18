#!/bin/bash

# Check if the correct number of command line arguments is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <clusterIP> <nodeName>"
    exit 1
fi

# Assign command line arguments to variables
clusterIP=$1
nodeName=$2

# Download the latest release (adjust the version as needed)
wget https://github.com/vi/websocat/releases/download/v1.8.0/websocat_amd64-linux -O websocat

# Move the binary to a directory in your PATH
sudo mv websocat /usr/local/bin/

# Set execution permissions
sudo chmod +x /usr/local/bin/websocat

# Step ii: Make a POST request
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://${clusterIP}:3001/api/clusterJoinRequest?nodeName=${nodeName}")

if [ "$response" -eq 200 ]; then
    echo "Cluster join request successful."
elif [ "$response" -eq 409 ]; then
    echo "The node name is already taken. Please choose a different name."
    exit 1
else
    echo "Unable to request node addition."
    exit 1
fi

# Step iii: Open a websocket
echo "Opening websocket to get join status..."
echo "ws://${clusterIP}:3002/getJoinStatus?nodeName=${nodeName}"
# Use a loop to continuously read messages until the WebSocket is closed
while read -r websocket_response; do
    if [ "$websocket_response" = "Join Successful" ]; then
        echo "Join Successful. Proceeding further."
        break  # Break out of the loop if the expected message is received
    else
        # Print all messages from the WebSocket
        echo "Received message: $websocket_response"
    fi
done < <(websocat ws://${clusterIP}:3002/getJoinStatus?nodeName=${nodeName})

# Check if the loop terminated without the "Join Successful" message
if [ "$websocket_response" != "Join Successful" ]; then
    echo "Unable to request node addition."
    exit 1
fi

# Step iv: Make a GET request
token_response=$(curl -s -w "\n%{http_code}" -X GET "http://${clusterIP}:3001/api/getToken?nodeName=${nodeName}")

http_status_code=$(echo "$token_response" | tail -n 1)

if [ "$http_status_code" -eq 200 ]; then
    token=$(echo "$token_response" | head -n -1 | jq -r '.token')
    echo "Token received: $token"

    # Step v: Run the script with the obtained token
    export K3S_NODE_NAME=$nodeName
    export K3S_URL="https://${clusterIP}:6443"
    export K3S_TOKEN=$token

    curl -sfL "https://get.k3s.io" | sh -s -

    echo "Node added to cluster successfully."
else
    echo "Unable to request node addition."
    exit 1
fi
