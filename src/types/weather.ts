export interface WeatherInfo {
  province: string;
  city: string;
  adcode: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
}

export interface WeatherResponse {
  status: string;
  count: string;
  info: string;
  infocode: string;
  lives: WeatherInfo[];
}