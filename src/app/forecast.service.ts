import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, shareReplay, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiKey = `2d42a22d65658c13b1bf85a24c188eda`;
  private apiLink = `https://api.openweathermap.org/data/2.5`;
  private cache: {
    [city: string]: { timestamp: number; data: Observable<any> };
  } = {};

  constructor(private http: HttpClient) {}

  searchCitiesByName(cityName: string): Observable<any> {
    const url = `${this.apiLink}/find?q=${cityName}&appid=${this.apiKey}`;
    return this.checkInCacheOrRequest(url, `list_${cityName}`);
  }

  getCurrentWeather(cityName: string): Observable<any> {
    const url = `${this.apiLink}/weather?q=${cityName}&appid=${this.apiKey}`;
    return this.checkInCacheOrRequest(url, `current_${cityName}`).pipe(
      map((item: any) => {
        item.main.temp = Math.round(item.main.temp);
        return item;
      })
    );
  }

  getForecastedWeather(cityName: string): Observable<any> {
    const url = `${this.apiLink}/forecast?q=${cityName}&cnt=5&appid=${this.apiKey}`;
    return this.checkInCacheOrRequest(url, `forecast_${cityName}`);
  }

  private checkInCacheOrRequest(
    url: string,
    cityName: string
  ): Observable<any> {
    const cachedData = this.cache[cityName];
    if (cachedData && this.isDataFresh(cachedData.timestamp)) {
      return cachedData.data;
    } else {
      const freshData = this.getFreshData(url);
      this.cache[cityName] = { timestamp: Date.now(), data: freshData };
      return freshData;
    }
  }

  private isDataFresh(timestamp: number): boolean {
    const currentTime = Date.now();
    const timeDifference = currentTime - timestamp;
    const oneHourInMilliseconds = 60 * 60 * 1000;
    return timeDifference < oneHourInMilliseconds;
  }

  private getFreshData(url: string): Observable<any> {
    return this.fetchData(url).pipe(shareReplay(1));
  }

  private fetchData(url: string): Observable<any> {
    return this.http.get(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
