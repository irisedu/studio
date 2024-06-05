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
}
