const roles = {
  "Data Analyst": { skills: { "SQL":82,"Excel":75,"Python":70,"Power BI":65,"Statistics":60 }, time: {"SQL":3,"Excel":2,"Python":4,"Power BI":2,"Statistics":3} },
  "Frontend Developer": { skills: { "HTML":85,"CSS":80,"JavaScript":90,"React":75,"Git":70,"Responsive Design":65 }, time: {"HTML":1,"CSS":2,"JavaScript":4,"React":3,"Git":1,"Responsive Design":2} },
  "Backend Developer": { skills: { "Node":85,"Express":75,"MongoDB":70,"API":80,"SQL":65,"Authentication":60 }, time: {"Node":3,"Express":2,"MongoDB":3,"API":2,"SQL":3,"Authentication":2} },
  "Full Stack Developer": { skills: { "HTML":80,"CSS":75,"JavaScript":90,"React":70,"Node":75,"MongoDB":65,"Git":70 }, time: {"HTML":1,"CSS":2,"JavaScript":4,"React":3,"Node":3,"MongoDB":3,"Git":1} },
  "Machine Learning Engineer": { skills: { "Python":90,"NumPy":70,"Pandas":75,"Scikit-learn":80,"Deep Learning":85 }, time: {"Python":4,"NumPy":2,"Pandas":2,"Scikit-learn":3,"Deep Learning":4} }
};

const skillAliases = {
  "JavaScript":["javascript","js","ecmascript"],
  "Node":["node","nodejs"],
  "SQL":["sql","mysql","postgres","sqlite"]
};

let marketChart;
let currentMissing = [];

/* Load roles */
function loadRoles() {
  const select = document.getElementById("role");
  select.innerHTML = "";
  for(const role in roles){
    select.innerHTML += `<option value="${role}">${role}</option>`;
  }
}
loadRoles();

/* Skill exists in resume */
function skillExists(skill, text){
  const aliases = skillAliases[skill] || [skill];
  return aliases.some(alias => new RegExp(`\\b${alias}\\b`, "i").test(text));
}

/* Add chip */
function addChip(container, skill, color) {
  // If container already has text, add a comma first
  if (container.textContent.length > 0) {
    container.textContent += ", ";
  }
  container.textContent += skill;
}

/* Main analyze */
function analyze(){
  const text = document.getElementById("resume").value.toLowerCase();
  const roleName = document.getElementById("role").value;
  const role = roles[roleName];

  if(!text.trim()){ alert("Paste resume first."); return; }

  const matchedDiv = document.getElementById("matched");
  const missingDiv = document.getElementById("missing");
  matchedDiv.innerHTML = ""; missingDiv.innerHTML = "";
  currentMissing = [];

  let total=0, matched=0;
  for(const skill in role.skills){
    total += role.skills[skill];
    if(skillExists(skill, text)){
      matched += role.skills[skill];
      addChip(matchedDiv, skill, "green");
    } else {
      currentMissing.push(skill);
      addChip(missingDiv, skill, "red");
    }
  }

  document.getElementById("score").textContent = `Alignment Score: ${Math.round(matched/total*100)}%`;
  renderMarketChart(role); renderRoadmap(role); renderSimulation();
  document.getElementById("output").classList.remove("hidden");
}

/* Chart */
function renderMarketChart(role){
  if(marketChart) marketChart.destroy();
  marketChart = new Chart(document.getElementById("marketChart"), {
    type: "bar",
    data: { labels: Object.keys(role.skills), datasets:[{label:"Market Demand", data:Object.values(role.skills), backgroundColor:"#4CAF50"}] },
    options: { responsive:true, plugins:{ legend:{display:false} } }
  });
}

/* Roadmap */
function renderRoadmap(role){
  const div = document.getElementById("roadmap"); div.innerHTML="";
  let roadmap = currentMissing.map(skill => ({skill, priority:role.skills[skill]/role.time[skill], duration:role.time[skill]}));
  roadmap.sort((a,b) => b.priority-a.priority);
  let week=1;
  roadmap.forEach(item=>{
    div.innerHTML += `<p>Week ${week}-${week+item.duration-1}: Learn ${item.skill} (${item.duration} weeks)</p>`;
    week += item.duration;
  });
}

/* Simulation */
function renderSimulation(){
  const div = document.getElementById("simulate"); div.innerHTML="";
  currentMissing.forEach(skill=>{
    const btn = document.createElement("button");
    btn.textContent = `Learn ${skill}`;
    btn.onclick = ()=>{ document.getElementById("resume").value += " " + skill; analyze(); };
    div.appendChild(btn);
  });
}

/* Attach button */
document.getElementById("analyzeBtn").addEventListener("click", analyze);
const pdfUpload = document.getElementById("pdfUpload");

pdfUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];

  if (!file || file.type !== "application/pdf") {
    alert("Please upload a valid PDF file.");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = function () {
    const typedarray = new Uint8Array(this.result);

    pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
      let textContent = "";

      const totalPages = pdf.numPages;

      const pagePromises = [];

      for (let i = 1; i <= totalPages; i++) {
        pagePromises.push(
          pdf.getPage(i).then(function (page) {
            return page.getTextContent().then(function (content) {
              const pageText = content.items.map(item => item.str).join(" ");
              textContent += pageText + " ";
            });
          })
        );
      }

      Promise.all(pagePromises).then(function () {
        document.getElementById("resume").value = textContent;
      });
    });
  };

  fileReader.readAsArrayBuffer(file);
});