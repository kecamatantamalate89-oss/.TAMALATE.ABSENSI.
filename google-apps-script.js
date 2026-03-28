/**
 * GOOGLE APPS SCRIPT - SIAGA ABSEN TAMALATE
 * 
 * Petunjuk:
 * 1. Buka Google Spreadsheet Anda (https://docs.google.com/spreadsheets/d/1YZWyJ9KOnUsfFpnBJVMZ-9VkUDKmTrmvEuULQCFFUuY/edit)
 * 2. Klik menu 'Extensions' -> 'Apps Script'
 * 3. Hapus semua kode yang ada dan tempelkan kode di bawah ini.
 * 4. Klik ikon simpan (Save).
 * 5. Klik tombol 'Deploy' -> 'New Deployment'.
 * 6. Pilih type 'Web App'.
 * 7. Set 'Execute as' ke 'Me'.
 * 8. Set 'Who has access' ke 'Anyone'.
 * 9. Klik 'Deploy', berikan izin (Authorize), dan salin 'Web App URL'.
 * 10. Masukkan URL tersebut ke dalam environment variable GAS_WEBAPP_URL di AI Studio.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1YZWyJ9KOnUsfFpnBJVMZ-9VkUDKmTrmvEuULQCFFUuY/edit").getSheets()[0];
    
    // Header: Timestamp, Jenis, Nama, NIP, Wilayah, Koordinat, Link Maps, Link Foto
    sheet.appendRow([
      data.timestamp,
      data.type,
      data.fullName,
      data.nip,
      data.subDistrict,
      data.location,
      data.locationUrl,
      data.photo // Ini adalah base64, di GAS sebaiknya disimpan ke Drive jika ingin link
    ]);
    
    // Opsional: Simpan foto ke Google Drive
    savePhotoToDrive(data);

    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function savePhotoToDrive(data) {
  try {
    var folderName = "ABSENSI_TAMALATE_FOTO";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    
    var contentType = data.photo.split(",")[0].split(":")[1].split(";")[0];
    var bytes = Utilities.base64Decode(data.photo.split(",")[1]);
    var blob = Utilities.newBlob(bytes, contentType, data.fullName + "_" + data.timestamp + ".jpg");
    
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Update baris terakhir dengan link foto Drive
    var sheet = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1YZWyJ9KOnUsfFpnBJVMZ-9VkUDKmTrmvEuULQCFFUuY/edit").getSheets()[0];
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 8).setValue(file.getUrl());
  } catch (e) {
    Logger.log("Error saving photo: " + e.toString());
  }
}
