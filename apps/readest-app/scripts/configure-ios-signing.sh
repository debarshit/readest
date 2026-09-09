#!/usr/bin/env bash
set -euo pipefail

APPLE_TEAM_ID="${APPLE_TEAM_ID:-9W7R4BWG7X}"
IOS_PROFILE_UUID="${IOS_PROFILE_UUID:-}"
BUILD_NUM="${BUILD_NUMBER:-1}"

echo "==> Configuring iOS Signing"
echo "    Team ID: $APPLE_TEAM_ID"
echo "    Profile UUID: $IOS_PROFILE_UUID"
echo "    Build Number: $BUILD_NUM"

mkdir -p src-tauri/gen/apple

cat << EOF > src-tauri/gen/apple/ExportOptions.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>${APPLE_TEAM_ID}</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.biblophile.yomi</key>
        <string>${IOS_PROFILE_UUID}</string>
    </dict>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

if [ -f "src-tauri/gen/apple/project.yml" ]; then
    echo "==> Updating project.yml and regenerating Xcode project"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/CFBundleVersion: .*/CFBundleVersion: \"$BUILD_NUM\"/" src-tauri/gen/apple/project.yml
        # Configure manual signing and bundle id
        sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER:.*/PRODUCT_BUNDLE_IDENTIFIER: com.biblophile.yomi\\
      CODE_SIGN_STYLE: Manual\\
      PROVISIONING_PROFILE_SPECIFIER: \"${IOS_PROFILE_UUID}\"\\
      CODE_SIGN_IDENTITY: \"Apple Distribution\"/" src-tauri/gen/apple/project.yml
    else
        sed -i "s/CFBundleVersion: .*/CFBundleVersion: \"$BUILD_NUM\"/" src-tauri/gen/apple/project.yml
        sed -i "s/PRODUCT_BUNDLE_IDENTIFIER:.*/PRODUCT_BUNDLE_IDENTIFIER: com.biblophile.yomi\n      CODE_SIGN_STYLE: Manual\n      PROVISIONING_PROFILE_SPECIFIER: \"${IOS_PROFILE_UUID}\"\n      CODE_SIGN_IDENTITY: \"Apple Distribution\"/" src-tauri/gen/apple/project.yml
    fi
    (cd src-tauri/gen/apple && env -u FORCE_COLOR xcodegen generate)
fi

echo "==> iOS Signing configuration complete"
