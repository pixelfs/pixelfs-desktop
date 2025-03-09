package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
)

type UserService struct{}

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

func (u *UserService) GetUserInfo() (*pb.GetUserInfoResponse, error) {
	response, err := rpc.UserService.GetUserInfo(
		context.Background(),
		connect.NewRequest(&pb.GetUserInfoRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg, nil
}
