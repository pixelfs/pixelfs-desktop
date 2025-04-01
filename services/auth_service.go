package services

import (
	"context"
	"errors"
	"sync"
	"time"

	"connectrpc.com/connect"
	"github.com/pixelfs/pixelfs/config"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/util"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type AuthService struct{}

var auth *AuthService
var onceAuth sync.Once

func NewAuthService() *AuthService {
	if auth == nil {
		onceAuth.Do(func() {
			auth = &AuthService{}
		})
	}

	return auth
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
	cfg, err := config.GetConfig()
	if err != nil {
		return err
	}

	token, err := util.GenerateAuthToken()
	if err != nil {
		return err
	}

	if _, err = rpc.AuthService.CreateCliSession(
		context.Background(),
		connect.NewRequest(&pb.CreateCliSessionRequest{
			Token: token,
		}),
	); err != nil {
		return err
	}

	// open login url
	if err := application.Get().BrowserOpenURL(cfg.Endpoint + "/auth/cli/" + token); err != nil {
		return err
	}

	timeout := time.After(10 * time.Minute)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for retries := 0; retries < 100; retries++ {
		select {
		case <-timeout:
			return errors.New("timeout")
		case <-ticker.C:
			response, err := rpc.AuthService.VerifyCliSession(
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
