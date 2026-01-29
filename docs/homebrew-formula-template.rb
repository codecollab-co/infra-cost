# Homebrew Formula Template for infra-cost
#
# IMPORTANT: This is a TEMPLATE file, not the active formula.
# The actual Homebrew formula should be maintained in a separate tap repository:
# https://github.com/codecollab-co/homebrew-tap
#
# To use this template:
# 1. Update the version and URL
# 2. Calculate the actual SHA256 checksum
# 3. Update the description for multi-cloud support
# 4. Place in codecollab-co/homebrew-tap repository
#
# See docs/HOMEBREW_SETUP.md for detailed instructions.

class InfraCost < Formula
  desc "Multi-cloud FinOps CLI tool for comprehensive cost analysis and infrastructure optimization"
  homepage "https://github.com/codecollab-co/infra-cost"
  url "https://github.com/codecollab-co/infra-cost/archive/v0.3.3.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"  # Calculate with: shasum -a 256 infra-cost-0.3.3.tar.gz
  license "MIT"
  head "https://github.com/codecollab-co/infra-cost.git", branch: "main"

  depends_on "node" => :build
  depends_on "npm" => :build

  def install
    # Install npm dependencies
    system "npm", "ci"

    # Build the project
    system "npm", "run", "build"

    # Create the executable wrappers
    (bin/"infra-cost").write <<~EOS
      #!/usr/bin/env node
      require('#{libexec}/dist/index.js');
    EOS

    # Create aws-cost symlink for backward compatibility
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
    assert_match "Usage: infra-cost", shell_output("#{bin}/infra-cost --help")

    # Test version output
    assert_match version.to_s, shell_output("#{bin}/infra-cost --version")

    # Test backward compatibility
    assert_match version.to_s, shell_output("#{bin}/aws-cost --version")
  end
end