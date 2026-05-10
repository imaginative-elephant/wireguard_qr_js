#!/bin/bash
NODE_VERSION=$(cat .nvmrc | tr -d ' \n\r')
docker build --build-arg NODE_VERSION=$NODE_VERSION -t wireguard-qr-js .