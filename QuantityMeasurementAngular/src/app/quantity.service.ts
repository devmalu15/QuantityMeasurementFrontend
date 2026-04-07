import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  QuantityDTO, QuantityOperationRequest, QuantityConvertRequest, MeasurementEntity
} from './models';
 
@Injectable({ providedIn: 'root' })
export class QuantityService {
  private readonly API_URL = 'https://qma-gateway.runasp.net';
  private http = inject(HttpClient);
 
  add(req: QuantityOperationRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.API_URL}/api/quantity/add`, req);
  }
 
  subtract(req: QuantityOperationRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.API_URL}/api/quantity/subtract`, req);
  }
 
  divide(req: QuantityOperationRequest): Observable<number> {
    return this.http.post<number>(`${this.API_URL}/api/quantity/divide`, req);
  }
 
  compare(req: QuantityOperationRequest): Observable<boolean> {
    return this.http.post<boolean>(`${this.API_URL}/api/quantity/compare`, req);
  }
 
  convert(req: QuantityConvertRequest): Observable<QuantityDTO> {
    return this.http.post<QuantityDTO>(`${this.API_URL}/api/quantity/convert`, req);
  }
 
  getHistory(type: 'redis' | 'ef' | 'sql'): Observable<MeasurementEntity[]> {
    return this.http.get<MeasurementEntity[]>(`${this.API_URL}/api/quantity/history/${type}`);
  }
}
