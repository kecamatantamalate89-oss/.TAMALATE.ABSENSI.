export interface AttendanceRecord {
  id: string;
  timestamp: string;
  type: 'DATANG' | 'PULANG';
  fullName: string;
  nip: string;
  location: string;
  locationUrl: string;
  photo: string;
  subDistrict: string;
}

export const SUB_DISTRICTS = [
  "KECAMATAN TAMALATE",
  "KELURAHAN MACCINI SOMBALA",
  "KELURAHAN TANJUNG MERDEKA",
  "KELURAHAN BAROMBONG",
  "KELURAHAN BALANG BARU",
  "KELURAHAN JONGAYA",
  "KELURAHAN BONGAYA",
  "KELURAHAN PABAENG-BAENG",
  "KELURAHAN BONTODURI",
  "KELURAHAN MANNURUKI",
  "KELURAHAN MANGASA",
  "KELURAHAN PARANG TAMBUNG"
];
