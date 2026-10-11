
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
    def do_OPTIONS(self):
        if self.path != "/api/onedrive/create-folder":
            self.send_error(404, "Not found")
            return

        allowed_origin = "http://127.0.0.1:5500"

        if (
            self.headers.get("Origin") != allowed_origin
            or self.headers.get("Access-Control-Request-Method") != "POST"
        ):
            self.send_error(403, "Not allowed")
            return

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Access-Control-Allow-Methods", "POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()


    def do_GET(self):
        
        if self.path == "/api/onedrive/folders":
            try:
                from onedrive_folders import list_test_folders

                folders = list_test_folders()
                result = json.dumps(folders).encode("utf-8")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
                self.send_header("Cache-Control", "no-store")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.send_header("Content-Length", str(len(result)))
                self.end_headers()
                self.wfile.write(result)

            except Exception as exc:
                print("OneDrive folder listing error:", exc)
                self.send_error(500, "Could not list OneDrive folders")

            return


        if self.path.startswith("/api/media?"):
            try:
                from urllib.parse import urlsplit, parse_qs
                from media_server import get_media_file, get_media_type

                params = parse_qs(urlsplit(self.path).query)
                relative_path = params.get("path", [""])[0]

                media_file = get_media_file(relative_path)
                file_size = media_file.stat().st_size

                self.send_response(200)
                self.send_header(
                    "Content-Type",
                    get_media_type(media_file)
                )
                self.send_header(
                    "Content-Disposition",
                    "inline"
                )
                self.send_header(
                    "X-Content-Type-Options",
                    "nosniff"
                )
                self.send_header(
                    "Access-Control-Allow-Origin",
                    "http://127.0.0.1:5500"
                )
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(file_size))
                self.end_headers()

                with media_file.open("rb") as file:
                    while True:
                        chunk = file.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)

            except (ValueError, FileNotFoundError):
                self.send_error(404, "Media file unavailable")
            except Exception as exc:
                print("Media preview error:", exc)
                self.send_error(500, "Media preview failed")
            return

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

    def do_POST(self):
        from urllib.parse import urlsplit
        import json

        allowed_origin = "http://127.0.0.1:5500"

        if urlsplit(self.path).path != "/api/onedrive/create-folder":
            self.send_error(404, "Not found")
            return

        # Only accept requests from our local dashboard.
        if self.headers.get("Origin") != allowed_origin:
            self.send_error(403, "Origin not allowed")
            return

        if self.headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
            self.send_error(415, "JSON required")
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_error(400, "Invalid content length")
            return

        if not 0 < length <= 1024:
            self.send_error(413, "Invalid request size")
            return

        try:
            data = json.loads(self.rfile.read(length))
            if not isinstance(data, dict):
                raise ValueError("Invalid request")

            from onedrive_folders import create_test_folder
            folder_name = create_test_folder(data.get("name"))

            result = json.dumps({
                "success": True,
                "folder": folder_name
            }).encode("utf-8")

            self.send_response(201)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Length", str(len(result)))
            self.end_headers()
            self.wfile.write(result)

        except (ValueError, FileNotFoundError) as exc:
            result = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Content-Length", str(len(result)))
            self.end_headers()
            self.wfile.write(result)

        except Exception as exc:
            print("OneDrive folder API error:", exc)
            self.send_error(500, "Folder creation failed")

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8001), Handler)
    print("Backend running at http://127.0.0.1:8001")
    server.serve_forever()
