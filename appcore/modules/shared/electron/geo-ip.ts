export class GeoIp {
  ipAddress: string;
  continentCode: string;
  continentName: string;
  countryCode: string;
  countryName: string;
  stateProv: string;
  city: string;

  constructor(ipAddress: string, city: string, stateProv: string, countryName: string) {
    this.ipAddress = ipAddress;
    this.city = city;
    this.stateProv = stateProv;
    this.countryName = countryName;
  }
}
