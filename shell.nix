{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    pkg-config
    nodejs_22
    nodejs_22.pkgs.pnpm
  ];

  buildInputs = with pkgs; [
    libsoup
    librsvg
    webkitgtk
  ];

  # https://github.com/tauri-apps/tauri-docs/issues/1560
  shellHook = ''
    export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
  '';
}
