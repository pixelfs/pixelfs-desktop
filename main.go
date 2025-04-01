package main

import (
	"embed"
	"os"
	"runtime"

	"github.com/pixelfs/pixelfs-desktop/services"
	"github.com/pixelfs/pixelfs/config"
	"github.com/pixelfs/pixelfs/log"
	"github.com/rs/zerolog"
	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/windows/icons.ico
var winIcon []byte

const appName = "PixelFS"

func main() {
	app := application.New(application.Options{
		Name:        appName,
		Description: "A cross-device file system, Transfer files based on s3-protocol.",
		Services: []application.Service{
			application.NewService(services.NewAuthService()),
			application.NewService(services.NewDatabaseService()),
			application.NewService(services.NewFileService()),
			application.NewService(services.NewFileSyncService()),
			application.NewService(services.NewLocalStorageService()),
			application.NewService(services.NewLocationService()),
			application.NewService(services.NewNodeService()),
			application.NewService(services.NewPreferencesService()),
			application.NewService(services.NewStorageService()),
			application.NewService(services.NewSystemService()),
			application.NewService(services.NewUserService()),
			application.NewService(services.NewUtilService()),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assets),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	window := app.NewWebviewWindowWithOptions(application.WebviewWindowOptions{
		Title:       appName,
		Width:       1200,
		Height:      768,
		AlwaysOnTop: true,
		Hidden:      false,
		Mac: application.MacWindow{
			Backdrop: application.MacBackdropTranslucent,
			TitleBar: application.MacTitleBarHidden,
		},
		Windows: application.WindowsWindow{
			HiddenOnTaskbar: true,
		},
		BackgroundColour: application.NewRGB(255, 255, 255),
		URL:              "/",
	})

	window.RegisterHook(events.Common.WindowClosing, func(e *application.WindowEvent) {
		if runtime.GOOS == "darwin" {
			window.Minimise()
		} else {
			window.Hide()
		}

		e.Cancel()
	})

	menu := application.NewMenu()
	menu.Add("打开应用").OnClick(func(ctx *application.Context) {
		if runtime.GOOS == "darwin" {
			window.UnMinimise()
		} else {
			window.Show()
		}
	})

	menu.AddSeparator()
	menu.Add("退出").OnClick(func(ctx *application.Context) { app.Quit() })

	systray := app.NewSystemTray()
	systray.SetIcon(winIcon)
	systray.SetMenu(menu)

	if err := app.Run(); err != nil {
		log.Fatal().Err(err)
	}
}

func init() {
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
}
