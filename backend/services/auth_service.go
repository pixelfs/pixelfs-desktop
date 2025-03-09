package services

import (
	"context"
	"errors"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/pixelfs/pixelfs/config"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
	"github.com/pixelfs/pixelfs/util"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type AuthService struct {
	ctx context.Context
	cfg *config.Config
	rpc *core.GrpcV1Client
}

var auth *AuthService
var onceAuth sync.Once

func Auth() *AuthService {
	if auth == nil {
		onceAuth.Do(func() {
			auth = &AuthService{}
		})
	}

	return auth
}

func (a *AuthService) Start(ctx context.Context, rpc *core.GrpcV1Client, cfg *config.Config) {
	a.ctx = ctx
	a.rpc = rpc
	a.cfg = cfg
}

func (a *AuthService) GetUserToken() (string, error) {
	cfg, err := config.GetConfig()
	if err != nil {
		return "", err
	}

	return cfg.Token, nil
}

func (a *AuthService) Logout() error {
	return config.Remove("token")
}

func (a *AuthService) Login() error {
	token, err := util.GenerateAuthToken()
	if err != nil {
		return err
	}

	if _, err = a.rpc.AuthService.CreateCliSession(
		context.Background(),
		connect.NewRequest(&pb.CreateCliSessionRequest{
			Token: token,
		}),
	); err != nil {
		return err
	}

	// open login url
	runtime.BrowserOpenURL(a.ctx, a.cfg.Endpoint+"/auth/cli/"+token)

	timeout := time.After(10 * time.Minute)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for retries := 0; retries < 100; retries++ {
		select {
		case <-timeout:
			return errors.New("timeout")
		case <-ticker.C:
			response, err := a.rpc.AuthService.VerifyCliSession(
				context.Background(),
				connect.NewRequest(&pb.VerifyCliSessionRequest{
					Token: token,
				}),
			)
			if err != nil {
				continue
			}

			if response.Msg.AuthToken != "" {
				if err := config.Set("token", response.Msg.AuthToken); err != nil {
					return err
				}

				return nil
			}
		}
	}

	return errors.New("failed")
}
