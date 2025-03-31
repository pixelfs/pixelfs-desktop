package main

import (
	"context"
	"embed"
	"fmt"
	"os"
	"runtime"

	"github.com/pixelfs/pixelfs-desktop/backend/services"
	"github.com/pixelfs/pixelfs/config"
	"github.com/pixelfs/pixelfs/log"
	"github.com/rs/zerolog"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var icon []byte

var version = "1.0.0"

const appName = "PixelFS"

func main() {
	cfgFile := os.Getenv("PIXELFS_CONFIG")
	if cfgFile != "" {
		err := config.LoadConfig(cfgFile, true)
		if err != nil {
			log.Fatal().Err(err).Msgf("error loading config file %s", cfgFile)
		}
	} else {
		err := config.LoadConfig("", false)
		if err != nil {
			log.Fatal().Err(err).Msgf("error loading config")
		}
	}

	cfg, err := config.GetConfig()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get pixelfs configuration")
	}

	logLevel := zerolog.InfoLevel
	if cfg.Debug {
		logLevel = zerolog.DebugLevel
	}

	log.SetLoggerColors()
	zerolog.SetGlobalLevel(logLevel)

	// Create an instance of the app structure
	userSvc := services.User()
	fileSvc := services.File()
	authSvc := services.Auth()
	nodeSvc := services.Node()
	systemSvc := services.System()
	storageSvc := services.Storage()
	locationSvc := services.Location()
	databaseSvc := services.Database()
	fileSyncSvc := services.FileSync()
	preferencesSvc := services.Preferences()
	localStorageSvc := services.LocalStorage()

	// Menu
	isMacOS := runtime.GOOS == "darwin"
	appMenu := menu.NewMenu()
	if isMacOS {
		appMenu.Append(menu.AppMenu())
		appMenu.Append(menu.EditMenu())
		appMenu.Append(menu.WindowMenu())
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:                    "PixelFS",
		Width:                    1200,
		Height:                   768,
		Menu:                     appMenu,
		HideWindowOnClose:        true,
		EnableDefaultContextMenu: true,
		AssetServer:              &assetserver.Options{Assets: assets},
		BackgroundColour:         options.NewRGBA(255, 255, 255, 0),
		OnStartup: func(ctx context.Context) {
			databaseSvc.Start(ctx)
			authSvc.Start(ctx)
			fileSvc.Start(ctx)
			systemSvc.Start(ctx)
			localStorageSvc.Start(ctx)
		},
		OnShutdown: func(ctx context.Context) {
			systemSvc.Stop()
		},
		Bind: []interface{}{
			userSvc,
			fileSvc,
			authSvc,
			nodeSvc,
			systemSvc,
			storageSvc,
			locationSvc,
			databaseSvc,
			fileSyncSvc,
			preferencesSvc,
			localStorageSvc,
		},
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			About: &mac.AboutInfo{
				Title:   fmt.Sprintf("%s %s", appName, version),
				Message: "A cross-device file system, Transfer files based on s3-protocol.\n\nCopyright © 2025",
				Icon:    icon,
			},
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
		Windows: &windows.Options{
			WebviewIsTransparent:              false,
			WindowIsTranslucent:               false,
			DisableFramelessWindowDecorations: false,
		},
		Linux: &linux.Options{
			ProgramName:         appName,
			Icon:                icon,
			WebviewGpuPolicy:    linux.WebviewGpuPolicyOnDemand,
			WindowIsTranslucent: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
