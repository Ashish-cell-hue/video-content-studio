
async function loadCurriculum() {
  try {
    const response = await fetch(
      "http://127.0.0.1:8001/api/curriculum"
    );

    if (!response.ok) {
      throw new Error("Curriculum API error: " + response.status);
    }

    const curriculum = await response.json();

    const grades = Object.keys(curriculum);

    console.log("Curriculum connected successfully!");
    console.log("Available grade sheets:", grades);
    console.log("Total sheets:", grades.length);

    return curriculum;

  } catch (error) {
    console.error("Curriculum connection failed:", error);
  }
}

loadCurriculum();

/* Curriculum Excel table renderer */

async function showCurriculumTable() {
  const container = document.getElementById("curriculumView");
  if (!container) return;

  container.replaceChildren();

  try {
    const response = await fetch(
      "http://127.0.0.1:8001/api/curriculum"
    );

    if (!response.ok) {
      throw new Error("Unable to load curriculum");
    }

    const workbook = await response.json();

    // Show only Grade 6 through Grade 12.
    const grades = Array.from(
      { length: 7 },
      (_, i) => `Grade ${i + 6}`
    ).filter(grade => Array.isArray(workbook[grade]));

    const heading = document.createElement("h2");
    heading.textContent = "Curriculum Excel Explorer";

    const selector = document.createElement("select");
    selector.className = "curriculum-grade-select";

    grades.forEach(grade => {
      const option = document.createElement("option");
      option.value = grade;
      option.textContent = grade;
      selector.appendChild(option);
    });

    const tableWrap = document.createElement("div");
    tableWrap.className = "curriculum-table-wrap";

    function renderGrade(grade) {
      tableWrap.replaceChildren();

      const rows = workbook[grade] || [];
      if (!rows.length) {
        tableWrap.textContent = "No curriculum rows available.";
        return;
      }

      const table = document.createElement("table");
      table.className = "curriculum-table";

      const columnCount = Math.max(
        ...rows.map(row => Array.isArray(row) ? row.length : 0)
      );

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      for (let col = 0; col < columnCount; col++) {
        const th = document.createElement("th");
        th.textContent = rows[0]?.[col] ?? `Column ${col + 1}`;
        headerRow.appendChild(th);
      }

      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");

      rows.slice(1).forEach(row => {
        if (!Array.isArray(row) || row.every(value => value == null || value === "")) {
          return;
        }

        const tr = document.createElement("tr");

        for (let col = 0; col < columnCount; col++) {
          const td = document.createElement("td");
          td.textContent = row[col] ?? "";
          tr.appendChild(td);
        }

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      tableWrap.appendChild(table);
    }

    selector.addEventListener("change", () => {
      renderGrade(selector.value);
    });

    container.append(heading, selector, tableWrap);

    if (grades.length) {
      renderGrade(grades[0]);
    } else {
      tableWrap.textContent = "No Grade 6–12 sheets found.";
    }

    console.log("Curriculum table ready!");

  } catch (error) {
    console.error(error);
    container.textContent = "Unable to load curriculum data.";
  }
}

/* Curriculum tab button connection */

document.getElementById("curriculumTab")
  ?.addEventListener("click", async () => {
    const view = document.getElementById("curriculumView");

    if (!view) return;

    view.hidden = false;

    document.getElementById("curriculumTab")
      .classList.add("active");

    document.getElementById("folderTab")
      ?.classList.remove("active");

    await renderExcelSheet("Grade 6");
  });
