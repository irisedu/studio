{ pkgs ? import <nixpkgs> {} }:

# https://discourse.nixos.org/t/electron-7-development-environment/5002/3
(pkgs.buildFHSUserEnv {
  name = "electron-env";
  targetPkgs = pkgs: (with pkgs;
    [
      nodejs_22 pnpm libcxx systemd libpulseaudio libdrm mesa stdenv.cc.cc
      alsa-lib atk at-spi2-atk at-spi2-core cairo cups dbus expat fontconfig
      freetype gdk-pixbuf glib gtk3 libnotify libuuid nspr nss pango
      libappindicator-gtk3 libdbusmenu libxkbcommon zlib
    ]
  ) ++ (with pkgs.xorg;
    [
      libXScrnSaver libXrender libXcursor libXdamage libXext libXfixes libXi
      libXrandr libX11 libXcomposite libxshmfence libXtst libxcb
    ]
  );
}).env
