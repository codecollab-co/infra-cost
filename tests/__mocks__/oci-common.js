// Manual mock for oci-common
const jestGlobals = require('@jest/globals');

class SimpleAuthenticationDetailsProvider {
  constructor(configurationPath, profile) {
    this.tenancyId = 'ocid1.tenancy.oc1..test';
    this.userId = 'ocid1.user.oc1..test';
    this.fingerprint = 'aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99';
    this.region = 'us-ashburn-1';
  }

  getKeyId() {
    return `${this.tenancyId}/${this.userId}/${this.fingerprint}`;
  }

  getTenancyId() {
    return this.tenancyId;
  }

  getUserId() {
    return this.userId;
  }

  getFingerprint() {
    return this.fingerprint;
  }

  getRegion() {
    return this.region;
  }
}

class ConfigFileAuthenticationDetailsProvider extends SimpleAuthenticationDetailsProvider {
  constructor(configurationPath, profile) {
    super(configurationPath, profile);
  }
}

const Region = {
  US_ASHBURN_1: 'us-ashburn-1',
  US_PHOENIX_1: 'us-phoenix-1',
  UK_LONDON_1: 'uk-london-1',
  EU_FRANKFURT_1: 'eu-frankfurt-1',
};

module.exports = {
  SimpleAuthenticationDetailsProvider,
  ConfigFileAuthenticationDetailsProvider,
  Region,
};
