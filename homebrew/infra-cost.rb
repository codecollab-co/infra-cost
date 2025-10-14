class InfraCost < Formula
  desc "CLI tool to perform cost analysis on your AWS account"
  homepage "https://github.com/codecollab-co/infra-cost"
  url "https://github.com/codecollab-co/infra-cost/archive/v0.1.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"
  head "https://github.com/codecollab-co/infra-cost.git", branch: "main"

  depends_on "node" => :build
  depends_on "npm" => :build

  def install
    # Install npm dependencies
    system "npm", "ci"

    # Build the project
    system "npm", "run", "build"

    # Create the executable wrapper
    (bin/"aws-cost").write <<~EOS
      #!/usr/bin/env node
      require('#{libexec}/dist/index.js');
    EOS

    # Install the built files
    libexec.install Dir["dist/*"], "package.json"

    # Install runtime dependencies only
    cd libexec do
      system "npm", "ci", "--production"
    end
  end

  test do
    # Test that the binary exists and shows help
    assert_match "Usage: aws-cost", shell_output("#{bin}/aws-cost --help")

    # Test version output
    assert_match version.to_s, shell_output("#{bin}/aws-cost --version")
  end
end