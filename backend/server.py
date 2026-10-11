
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import csv
import json
import openpyxl

# Private data stays outside the website folder.
PRIVATE_DIR = Path(__import__("os").environ["VIDEO_CONTENT_PRIVATE_DIR"])
CSV_FILE = PRIVATE_DIR / "master_folder_report.csv"
EXCEL_FILE = PRIVATE_DIR / "Final Curriculum Skeleton (2).xlsx"

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        
        if self.path.startswith("/api/curriculum-format?"):
            try:
                from urllib.parse import urlparse, parse_qs
                from excel_format import get_sheet_format

                params = parse_qs(urlparse(self.path).query)
                grade = params.get("grade", [""])[0]

                formatted_sheet = get_sheet_format(EXCEL_FILE, grade)

                result = json.dumps(
                    formatted_sheet,
                    ensure_ascii=False,
                    default=str
                ).encode("utf-8")

                self.send_response(200)
                self.send_header(
                    "Content-Type",
                    "application/json; charset=utf-8"
                )
                self.send_header("Cache-Control", "no-store")
                self.send_header(
                    "Access-Control-Allow-Origin",
                    "http://127.0.0.1:5500"
                )
                self.send_header("Content-Length", str(len(result)))
                self.end_headers()
                self.wfile.write(result)

            except ValueError as exc:
                self.send_error(400, str(exc))
            except Exception as exc:
                print("Excel formatting error:", exc)
                self.send_error(500, "Could not read Excel formatting")

            return


        
        if self.path == "/api/curriculum":
            try:
                workbook = openpyxl.load_workbook(
                    EXCEL_FILE,
                    read_only=True,
                    data_only=True
                )

                try:
                    curriculum = {}

                    for sheet in workbook.worksheets:
                        rows = []

                        for row in sheet.iter_rows(values_only=True):
                            rows.append([
                                (
                                    value.isoformat()
                                    if hasattr(value, "isoformat")
                                    else value
                                )
                                for value in row
                            ])

                        curriculum[sheet.title] = rows

                    result = json.dumps(
                        curriculum,
                        ensure_ascii=False,
                        default=str
                    ).encode("utf-8")

                finally:
                    workbook.close()

                self.send_response(200)
                self.send_header(
                    "Content-Type",
                    "application/json; charset=utf-8"
                )
                self.send_header("Cache-Control", "no-store")
                self.send_header(
                    "Access-Control-Allow-Origin",
                    "http://127.0.0.1:5500"
                )
                self.send_header("Content-Length", str(len(result)))
                self.end_headers()
                self.wfile.write(result)

            except Exception as exc:
                print("Curriculum error:", exc)
                self.send_error(500, "Could not read curriculum")

            return

        if self.path != "/api/folders":
            self.send_error(404, "Not found")
            return

        try:
            with CSV_FILE.open("r", encoding="utf-8-sig", newline="") as f:
                rows = list(csv.DictReader(f))

            result = json.dumps(
                rows, ensure_ascii=False
            ).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
            self.send_header("Content-Length", str(len(result)))
            self.end_headers()
            self.wfile.write(result)

        except Exception as exc:
            print("Backend error:", exc)
            self.send_error(500, "Could not read folder report")

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8001), Handler)
    print("Backend running at http://127.0.0.1:8001")
    server.serve_forever()
