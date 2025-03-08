package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
)

type UserService struct {
	ctx context.Context
	rpc *core.GrpcV1Client
}

var user *UserService
var onceUser sync.Once

func User() *UserService {
	if user == nil {
		onceUser.Do(func() {
			user = &UserService{}
		})
	}

	return user
}

func (u *UserService) Start(ctx context.Context, rpc *core.GrpcV1Client) {
	u.ctx = ctx
	u.rpc = rpc
}

func (u *UserService) GetUserInfo() (*pb.GetUserInfoResponse, error) {
	response, err := u.rpc.UserService.GetUserInfo(
		context.Background(),
		connect.NewRequest(&pb.GetUserInfoRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg, nil
}
