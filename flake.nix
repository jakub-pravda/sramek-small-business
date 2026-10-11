{
  description = "DevShell for the WWW project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    playwright-cli = {
      url = "github:takeaship/playwright-cli-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = { self, nixpkgs, playwright-cli }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        inherit system;
        pkgs = import nixpkgs { inherit system; };
      });
    in 
    {
      devShells = forEachSupportedSystem ({ pkgs, system }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
              awscli2
              go
              html-tidy
              nodejs_22
              python3
              pulumi
              pulumiPackages.pulumi-language-go
          ] ++ nixpkgs.lib.optional (playwright-cli.packages ? ${system})
            playwright-cli.packages.${system}.default;
        };
      });
    };
}
