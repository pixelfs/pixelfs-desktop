package services

import (
	"context"
	"sync"

	"connectrpc.com/connect"
	pb "github.com/pixelfs/pixelfs/gen/pixelfs/v1"
	"github.com/pixelfs/pixelfs/rpc/core"
	"github.com/pixelfs/pixelfs/util"
)

type LocationService struct {
	ctx context.Context
	rpc *core.GrpcV1Client
}

var location *LocationService
var onceLocation sync.Once

func Location() *LocationService {
	if location == nil {
		onceLocation.Do(func() {
			location = &LocationService{}
		})
	}

	return location
}

func (l *LocationService) Start(ctx context.Context, rpc *core.GrpcV1Client) {
	l.ctx = ctx
	l.rpc = rpc
}

func (l *LocationService) GetLocations() ([]*pb.Location, error) {
	response, err := l.rpc.LocationService.GetLocations(
		context.Background(),
		connect.NewRequest(&pb.GetLocationsRequest{}),
	)

	if err != nil {
		return nil, err
	}

	return response.Msg.GetLocations(), nil
}

func (l *LocationService) AddLocation(nodeId, name, path, blockSize string, blockDuration int64) (*pb.AddLocationResponse, error) {
	bSize, err := util.ParseBytes(blockSize)
	if err != nil {
		return nil, err
	}

	response, err := l.rpc.LocationService.AddLocation(
		context.Background(),
		connect.NewRequest(&pb.AddLocationRequest{
			Location: &pb.Location{
				NodeId:        nodeId,
				Name:          name,
				Type:          pb.LocationType_LOCAL,
				Path:          path,
				BlockSize:     int64(bSize),
				BlockDuration: blockDuration,
			},
		}),
	)
	if err != nil {
		return nil, err
	}

	return response.Msg, nil
}

func (l *LocationService) RemoveLocation(locationId string) (*pb.RemoveLocationResponse, error) {
	response, err := l.rpc.LocationService.RemoveLocation(
		context.Background(),
		connect.NewRequest(&pb.RemoveLocationRequest{
			LocationId: locationId,
		}),
	)
	if err != nil {
		return nil, err
	}

	return response.Msg, nil
}
