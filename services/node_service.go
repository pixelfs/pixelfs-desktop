package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
)

type NodeService struct{}

var node *NodeService
var onceNode sync.Once

func NewNodeService() *NodeService {
	if node == nil {
		onceNode.Do(func() {
			node = &NodeService{}
		})
	}

	return node
}

func (u *NodeService) GetNodes() ([]*pb.Node, error) {
	response, err := rpc.NodeService.GetNodes(
		context.Background(),
		connect.NewRequest(&pb.GetNodesRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetNodes(), nil
}

func (u *NodeService) RemoveNode(nodeId string) error {
	_, err := rpc.NodeService.Remove(
		context.Background(),
		connect.NewRequest(&pb.NodeRemoveRequest{
			NodeId: nodeId,
		}),
	)
	if err != nil {
		return err
	}

	return nil
}
