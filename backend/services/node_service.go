package services

import (
	"context"
	"errors"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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
	result, _ := runtime.MessageDialog(u.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Message:       "确定要删除节点吗?",
		Buttons:       []string{"确定", "取消"},
		DefaultButton: "确定",
	})

	if result == "取消" {
		return errors.New("cancel")
	}

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
