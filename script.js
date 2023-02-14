const htmlEl = document.documentElement;

const Caches = {};

const get = async (url) => {
  if (Caches[url]) return Caches[url];
  htmlEl.setAttribute("data-no-touch", true);
  const f = await fetch(url, {
    header: {
      "Content-Type": "application/json"
    }
  });
  const data = await f.json();
  console.log(data)
  Caches[url] = data;
  htmlEl.setAttribute("data-no-touch", false);
  return data;
};

const Images = {};

const loadImage = (src, onOver) => {
  if (Images[src]) return onOver(Images[src]);
  const el = new Image();
  el.crossOrigin = "Anonymous";
  el.src = src;
  el.onload = () => {
    onOver(el);
    Images[src] = el;
  };
};

const typeTexts = `第一部
最喜欢
看最多次
最想安利
最佳剧情
最佳画面
最佳配乐
最佳表演
最治愈
最感动
最虐心
最恐怖
最被低估
最过誉
最讨厌`;

const types = typeTexts.trim().split(/\n+/g);

const movieLocalKey = "movie-grid";

let movies = [];

const generatorDefaultMovies = () => {
  movies = new Array(types.length).fill(null);
};

const getMovieIdsText = () => movies.map((i) => String(i || 0)).join(",");

const getMoviesFormLocalStorage = () => {
  if (!window.localStorage) return generatorDefaultMovies();

  const moviesText = localStorage.getItem(movieLocalKey);
  if (!moviesText) return generatorDefaultMovies();

  movies = moviesText.split(/,/g).map((i) => (/^\d+$/.test(i) ? +i : i));
};

getMoviesFormLocalStorage();
const saveMoviesToLocalStorage = () => {
  localStorage.setItem(movieLocalKey, getMovieIdsText());
};

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const bodyMargin = 20;
const contentWidth = 600;
const contentHeight = 560;

const col = 5;
const row = 3;

const colWidth = Math.ceil(contentWidth / col);
const rowHeight = Math.ceil(contentHeight / row);
const titleHeight = 40;
const fontHeight = 24;

const width = contentWidth + bodyMargin * 2;
const height = contentHeight + bodyMargin * 2 + titleHeight;
const scale = 3;

canvas.width = width * scale;
canvas.height = height * scale;

ctx.fillStyle = "#FFF";
ctx.fillRect(0, 0, width * scale, height * scale);

ctx.textAlign = "left";
ctx.font = `${9 * scale}px sans-serif`;
ctx.fillStyle = "#AAA";
ctx.textBaseline = "middle";
ctx.lineCap = "round";
ctx.lineJoin = "round";
// ctx.fillText(
//     '@卜卜口 · lab.magiconch.com/anime-grid · 神奇海螺试验场 · 动画信息来自番组计划 · 禁止商业、盈利用途',
//     19 * scale,
//     (height - 10) * scale
// );

ctx.scale(scale, scale);
ctx.translate(bodyMargin, bodyMargin + titleHeight);

ctx.font = "16px sans-serif";
ctx.fillStyle = "#222";
ctx.textAlign = "center";

ctx.save();

ctx.font = "bold 24px sans-serif";
ctx.fillText("电影生涯个人喜好表", contentWidth / 2, -24);

ctx.lineWidth = 2;
ctx.strokeStyle = "#222";

for (let y = 0; y <= row; y++) {
  ctx.beginPath();
  ctx.moveTo(0, y * rowHeight);
  ctx.lineTo(contentWidth, y * rowHeight);
  ctx.globalAlpha = 1;
  ctx.stroke();

  if (y === row) break;
  ctx.beginPath();
  ctx.moveTo(0, y * rowHeight + rowHeight - fontHeight);
  ctx.lineTo(contentWidth, y * rowHeight + rowHeight - fontHeight);
  ctx.globalAlpha = 0.2;
  ctx.stroke();
}
ctx.globalAlpha = 1;
for (let x = 0; x <= col; x++) {
  ctx.beginPath();
  ctx.moveTo(x * colWidth, 0);
  ctx.lineTo(x * colWidth, contentHeight);
  ctx.stroke();
}
ctx.restore();

for (let y = 0; y < row; y++) {
  for (let x = 0; x < col; x++) {
    const top = y * rowHeight;
    const left = x * colWidth;
    const type = types[y * col + x];
    ctx.fillText(type, left + colWidth / 2, top + rowHeight - fontHeight / 2);
  }
}

const APIURL = `https://api.wmdb.tv/api/v1/`;


let currentMovieIndex = null;
const searchBoxEl = document.querySelector(".search-bangumis-box");
const formEl = document.querySelector("form");
const searchInputEl = formEl[0];
const candidateListEl = document.querySelector(".candidate-list");

const openSearchBox = (index) => {
  currentMovieIndex = index;
  htmlEl.setAttribute("data-no-scroll", true);
  searchBoxEl.setAttribute("data-show", true);

  searchInputEl.focus();

  const { title } = movies[currentMovieIndex];

  if (title) {
    searchInputEl.value = title;
  }
};
const closeSearchBox = () => {
  htmlEl.setAttribute("data-no-scroll", false);
  searchBoxEl.setAttribute("data-show", false);
  searchInputEl.value = "";
  formEl.onsubmit();
};
const setInputText = () => {
  const text = searchInputEl.value.trim().replace(/,/g, "");
  // const data = {
  //   title: text,
  // };
  setCurrentMovie(text);
};

const setCurrentMovie = (value) => {
  movies[currentMovieIndex] = value;
  saveMoviesToLocalStorage();
  drawMovies();

  closeSearchBox();
};

candidateListEl.onclick = (e) => {
  const poster = e.target.children[0].getAttribute("src");
  if (currentMovieIndex === null) return;
  setCurrentMovie(poster);
};

const searchFromAPI = async (keyword) => {
  let url;

  if (keyword) {
    url = `${APIURL}movie/search?q=${encodeURIComponent(keyword)}`;
  } else {
    url = `${APIURL}top?type=Imdb&skip=0&limit=20&lang=Cn`;
  }

  const candidates = await get(url);
  resetCandidateList(candidates);
};

const resetCandidateList = (candidates) => {
  candidateListEl.innerHTML = candidates
    .map((item) => {
      const candidate = item.data[0];
      return `<div class="candidate-item" data-id="${candidate.id}"><img src="${candidate.poster}" crossOrigin="Anonymous"><h3>${candidate.name}</h3></div>`;
    })
    .join("");
};
formEl.onsubmit = async (e) => {
  if (e) e.preventDefault();

  const keyword = searchInputEl.value.trim();

  searchFromAPI(keyword);
};

formEl.onsubmit();

const imageWidth = colWidth - 2;
const imageHeight = rowHeight - fontHeight;
const canvasRatio = imageWidth / imageHeight;

ctx.font = "bold 32px sans-serif";

const drawMovies = () => {
  for (let index in movies) {
    const data = movies[index];

    const x = index % col;
    const y = Math.floor(index / col);
    const usePoster = /^https:\/\/.*\.(jpg)/.test(data);
    const isIndex = /^\d+$/.test(data);

    if (!usePoster && !isIndex) {
      // use input text
      ctx.save();
      ctx.fillStyle = "#FFF";
      ctx.fillRect(
        x * colWidth + 1,
        y * rowHeight + 1,
        imageWidth,
        imageHeight
      );
      ctx.restore();
      ctx.fillText(
        data,
        (x + 0.5) * colWidth,
        (y + 0.5) * rowHeight - 4,
        imageWidth - 10
      );
      continue;
    } else if (usePoster && !isIndex) {
      loadImage(data, (el) => {
        const { naturalWidth, naturalHeight } = el;
        const originRatio = el.naturalWidth / el.naturalHeight;

        let sw, sh, sx, sy;
        if (originRatio < canvasRatio) {
          sw = naturalWidth;
          sh = (naturalWidth / imageWidth) * imageHeight;
          sx = 0;
          sy = naturalHeight - sh;
        } else {
          sh = naturalHeight;
          sw = (naturalHeight / imageHeight) * imageWidth;
          sx = naturalWidth - sw;
          sy = 0;
        }

        ctx.drawImage(
          el,
          sx,
          sy,
          sw,
          sh,

          x * colWidth + 1,
          y * rowHeight + 1,
          imageWidth,
          imageHeight
        );
      });
    }
  }
};

const outputEl = document.querySelector(".output-box");
const outputImageEl = outputEl.querySelector("img");
const showOutput = (imgURL) => {
  outputImageEl.src = imgURL;
  outputEl.setAttribute("data-show", true);
  htmlEl.setAttribute("data-no-scroll", true);
};
const closeOutput = () => {
  outputEl.setAttribute("data-show", false);
  htmlEl.setAttribute("data-no-scroll", false);
};

const downloadImage = () => {
  const fileName = "电影生涯个人喜好表.jpg";
  const mime = "image/jpeg";
  const imgURL = canvas.toDataURL(mime, 0.8);
  const linkEl = document.createElement("a");
  linkEl.download = fileName;
  linkEl.href = imgURL;
  linkEl.dataset.downloadurl = [mime, fileName, imgURL].join(":");
  document.body.appendChild(linkEl);
  linkEl.click();
  document.body.removeChild(linkEl);
  // new Image().src = `${APIURL}grid?ids=${getMovieIdsText()}`;

  showOutput(imgURL);
};

canvas.onclick = (e) => {
  const rect = canvas.getBoundingClientRect();
  const { clientX, clientY } = e;
  const x = Math.floor(
    (((clientX - rect.left) / rect.width) * width - bodyMargin) / colWidth
  );
  const y = Math.floor(
    (((clientY - rect.top) / rect.height) * height - bodyMargin - titleHeight) /
      rowHeight
  );

  if (x < 0) return;
  if (x > col) return;
  if (y < 0) return;
  if (y > row) return;

  const index = y * col + x;

  if (index >= col * row) return;

  openSearchBox(index);
};

drawMovies();
