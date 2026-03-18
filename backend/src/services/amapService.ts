import axios from 'axios';

export interface GeocodeResult {
  province: string;
  city: string;
  district: string;
}

export class AmapService {
  private readonly apiKey: string;
  private readonly geocodeUrl: string;

  constructor() {
    this.apiKey = '73ee8b09487115432ff2ef650fdd5465';
    this.geocodeUrl = 'https://restapi.amap.com/v3/geocode/geo';
  }

  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      if (!address || address.trim() === '') {
        return null;
      }

      const response = await axios.get(this.geocodeUrl, {
        params: {
          key: this.apiKey,
          address: address.trim()
        }
      });

      if (response.data.status !== '1') {
        console.error('高德API返回错误:', response.data);
        return null;
      }

      if (!response.data.geocodes || response.data.geocodes.length === 0) {
        console.error('高德API没有返回结果');
        return null;
      }

      const geocode = response.data.geocodes[0];
      return {
        province: geocode.province || '',
        city: geocode.city || '',
        district: geocode.district || ''
      };
    } catch (error: any) {
      console.error(`高德API调用失败: ${error.message}`);
      return null;
    }
  }
}
