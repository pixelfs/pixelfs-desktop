package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
)

type NodeService struct {
	ctx context.Context
	rpc *core.GrpcV1Client
}

var node *NodeService
var onceNode sync.Once

func Node() *NodeService {
	if node == nil {
		onceNode.Do(func() {
			node = &NodeService{}
		})
	}

	return node
}

func (n *NodeService) Start(ctx context.Context, rpc *core.GrpcV1Client) {
	n.ctx = ctx
	n.rpc = rpc
}

func (u *NodeService) GetNodes() ([]*pb.Node, error) {
	response, err := u.rpc.NodeService.GetNodes(
		context.Background(),
		connect.NewRequest(&pb.GetNodesRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetNodes(), nil
}

func (u *NodeService) RemoveNode(nodeId string) error {
	_, err := u.rpc.NodeService.Remove(
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
