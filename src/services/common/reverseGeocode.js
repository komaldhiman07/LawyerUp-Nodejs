import https from "https";

class ReverseGeocodeService {
  constructor() {}

  getAddressFromResponse = (data) => {
    if (!data || !data.address) {
      return {};
    }
    const address = data.address;
    return {
      state: address.state || "",
      city:
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.county ||
        "",
      country_code: address.country_code || "",
    };
  };

  fetchJson = async (url, headers) =>
    new Promise((resolve, reject) => {
      const request = https.get(url, { headers }, (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            return reject(
              new Error(`Reverse geocode failed with status ${response.statusCode}`)
            );
          }
          try {
            const parsed = JSON.parse(data);
            return resolve(parsed);
          } catch (error) {
            return reject(new Error("Reverse geocode JSON parse failed"));
          }
        });
      });
      request.on("error", (error) => reject(error));
      request.end();
    });

  reverseLookup = async ({ latitude, longitude }) => {
    const baseUrl =
      process.env.REVERSE_GEOCODE_URL ||
      "https://nominatim.openstreetmap.org/reverse";
    const userAgent =
      process.env.REVERSE_GEOCODE_USER_AGENT || "lawyerup-backend/1.0";
    const countryCode = (process.env.REVERSE_GEOCODE_COUNTRY || "us").toLowerCase();
    const url = `${baseUrl}?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}&countrycodes=${countryCode}`;
    const payload = await this.fetchJson(url, {
      "User-Agent": userAgent,
      Accept: "application/json",
    });
    const address = this.getAddressFromResponse(payload);
    return {
      state: address.state,
      city: address.city,
      country_code: address.country_code,
      raw: payload,
    };
  };
}

export default new ReverseGeocodeService();
