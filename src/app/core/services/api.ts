import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

type QueryParams = Record<string, string | number | boolean>;
interface RequestOptions {
  headers?: Record<string, string>;
}

/** Every backend JSON response uses this envelope (see the backend's `sendSuccess`/`errorHandler`). */
interface ApiEnvelope<T> {
  success: true;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class Api {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(this.url(path), { params: this.toHttpParams(params) })
      .pipe(map((response) => response.data));
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .post<ApiEnvelope<T>>(this.url(path), body, { headers: this.toHttpHeaders(options) })
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .put<ApiEnvelope<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http
      .patch<ApiEnvelope<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiEnvelope<T>>(this.url(path))
      .pipe(map((response) => response.data));
  }

  /**
   * Builds a full URL (base + path + query) without making a request. For endpoints meant to be
   * navigated to directly rather than fetched via XHR — e.g. the CSV export download, which the
   * browser should stream straight to disk via a plain anchor click, not buffer through
   * HttpClient (and which therefore never needs CORS, since it's a navigation, not a script-read).
   */
  buildUrl(path: string, params?: QueryParams): string {
    const query = this.toHttpParams(params)?.toString();
    return query ? `${this.url(path)}?${query}` : this.url(path);
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private toHttpParams(params?: QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, value);
    }
    return httpParams;
  }

  private toHttpHeaders(options?: RequestOptions): HttpHeaders | undefined {
    return options?.headers ? new HttpHeaders(options.headers) : undefined;
  }
}
