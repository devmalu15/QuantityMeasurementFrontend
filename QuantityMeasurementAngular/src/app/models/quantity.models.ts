export interface QuantityDTO {
  value: number;
  unit:  string;
}
 
export interface QuantityOperationRequest {
  q1: QuantityDTO;
  q2: QuantityDTO;
}
 
export interface QuantityConvertRequest {
  input:      QuantityDTO;
  targetUnit: string;
}
 
export interface MeasurementEntity {
  id:        number;
  operation: string;
  operand1:  number;
  operand2:  number;
  result:    string;
}
 
export interface LoginRequest    { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; }
export interface AuthResponse {
  token:  string;
  email:  string;
  expiry: string;
}
