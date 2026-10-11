
/* Original Excel-style Curriculum Viewer */

async function renderExcelSheet(grade = "Grade 6") {
  const container = document.getElementById("curriculumView");
  if (!container) return;

  container.hidden = false;
  container.replaceChildren();

  const status = document.createElement("p");
  status.textContent = `${grade} worksheet loading...`;
  container.appendChild(status);

  try {
    const url =
      "http://127.0.0.1:8001/api/curriculum-format?grade=" +
      encodeURIComponent(grade);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Excel API error: ${response.status}`);
    }

    const data = await response.json();

    const heading = document.createElement("h2");
    heading.textContent = "Curriculum Excel Viewer";

    const selector = document.createElement("select");
    selector.className = "curriculum-grade-select";

    for (let number = 6; number <= 12; number++) {
      const option = document.createElement("option");
      option.value = `Grade ${number}`;
      option.textContent = `Grade ${number}`;
      selector.appendChild(option);
    }

    selector.value = grade;
    selector.addEventListener("change", () => {
      renderExcelSheet(selector.value);
    });

    const wrap = document.createElement("div");
    wrap.className = "curriculum-table-wrap excel-sheet-wrap";

    const table = document.createElement("table");
    table.className = "excel-original-table";

    const colgroup = document.createElement("colgroup");

    for (let column = 1; column <= data.maxCol; column++) {
      const letter = excelColumnLetter(column);
      const width = data.columns[letter]?.width ?? 8.43;
      const col = document.createElement("col");

      // Approximate Excel character width in browser pixels.
      col.style.width = `${Math.max(45, width * 7 + 5)}px`;
      colgroup.appendChild(col);
    }

    table.appendChild(colgroup);

    const mergeMap = new Map();
    const coveredCells = new Set();

    for (const range of data.merged) {
      const match = range.match(
        /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/
      );

      if (!match) continue;

      const firstCol = excelColumnNumber(match[1]);
      const firstRow = Number(match[2]);
      const lastCol = excelColumnNumber(match[3]);
      const lastRow = Number(match[4]);

      mergeMap.set(`${firstRow}:${firstCol}`, {
        rowSpan: lastRow - firstRow + 1,
        colSpan: lastCol - firstCol + 1
      });

      for (let r = firstRow; r <= lastRow; r++) {
        for (let c = firstCol; c <= lastCol; c++) {
          if (r !== firstRow || c !== firstCol) {
            coveredCells.add(`${r}:${c}`);
          }
        }
      }
    }

    const cellMap = new Map();

    for (const cell of data.cells) {
      cellMap.set(`${cell.row}:${cell.col}`, cell);
    }

    const tbody = document.createElement("tbody");

    for (let row = 1; row <= data.maxRow; row++) {
      const tr = document.createElement("tr");
      const rowHeight = data.rows[String(row)]?.height;

      if (rowHeight != null) {
        tr.style.height = `${rowHeight * 96 / 72}px`;
      }

      for (let col = 1; col <= data.maxCol; col++) {
        const key = `${row}:${col}`;

        if (coveredCells.has(key)) continue;

        const td = document.createElement("td");
        const merge = mergeMap.get(key);
        const cell = cellMap.get(key);

        if (merge) {
          td.rowSpan = merge.rowSpan;
          td.colSpan = merge.colSpan;
        }

        if (cell) {
          td.textContent = cell.value ?? "";

          const style = cell.style || {};

          if (style.bold) td.style.fontWeight = "bold";
          if (style.italic) td.style.fontStyle = "italic";

          if (style.fontSize) {
            td.style.fontSize = `${style.fontSize}pt`;
          }

          if (style.fontColor) {
            td.style.color = style.fontColor;
          }

          if (style.background) {
            td.style.backgroundColor = style.background;
          }

          if (["left", "center", "right", "justify"]
              .includes(style.horizontal)) {
            td.style.textAlign = style.horizontal;
          }

          if (["top", "center", "bottom"]
              .includes(style.vertical)) {
            td.style.verticalAlign =
              style.vertical === "center"
                ? "middle"
                : style.vertical;
          }

          td.style.whiteSpace = style.wrapText
            ? "pre-wrap"
            : "pre-line";

          if (style.border) {
            for (const side of ["left", "right", "top", "bottom"]) {
              if (style.border[side]) {
                td.style[`border${side[0].toUpperCase() + side.slice(1)}`] =
                  "1px solid #87929f";
              }
            }
          }
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrap.appendChild(table);

    container.replaceChildren(heading, selector, wrap);

    console.log("Original Excel-style sheet rendered:", grade);

  } catch (error) {
    console.error("Excel viewer error:", error);
    container.textContent =
      "Excel worksheet load nahi ho paayi. Backend check karein.";
  }
}

function excelColumnNumber(letters) {
  return [...letters].reduce(
    (result, char) =>
      result * 26 + char.charCodeAt(0) - 64,
    0
  );
}

function excelColumnLetter(number) {
  let result = "";

  while (number > 0) {
    number--;
    result =
      String.fromCharCode(65 + number % 26) + result;
    number = Math.floor(number / 26);
  }

  return result;
}
