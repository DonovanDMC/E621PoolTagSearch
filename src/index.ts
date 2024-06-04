import type { CurrentUser, ErrorResponse, Pool, PoolResponse } from "./types";

const baseURL = "https://pools.e621.ws/json";
// const baseURL = "http://websites4.containers.local:3000/json";
document.addEventListener("DOMContentLoaded", async() => {
    if (window.location.pathname !== "/pools") {
        return;
    }

    const searchForm = getSearchForm();
    addHiddenPageInput(searchForm);
    addTagsSearch(searchForm);
    initFormListener(searchForm);
    if (searchForm.find("input[name='search[tags]']").val()) {
        reinitPagination(0);
        await reinitSearch();
    }
});

function reinitPagination(pages: number) {
    const $table = $("table.striped");
    const query = getQuery(getSearchForm());
    const page = Number(query.get("page") || getPage());
    $(".paginator").remove();
    const div = $("<div class=\"paginator\"></div>");
    const menu = $("<menu></menu>");
    const arrowRight = $("<li class=\"arrow\"><span><i class=\"fa-solid fa-chevron-left\"></i></span></li>");
    const arrowRightActive = $(`<li class="arrow"><a href="#" data-page-id="${page - 1}"><i class="fa-solid fa-chevron-left"></i></span></li>`);
    const arrowLeft = $("<li class=\"arrow\"><span><i class=\"fa-solid fa-chevron-right\"></i></span></li>");
    const arrowLeftActive = $(`<li class="arrow"><a href="#" data-page-id="${page + 1}"><i class="fa-solid fa-chevron-right"></i></span></li>`);
    if (pages === 0) {
        arrowRight.appendTo(div);
        arrowLeft.appendTo(div);
        return;
    }

    const parts: Array<JQuery<HTMLElement>> = [];
    if (page > 1 && pages > 1) {
        parts.push(arrowRightActive);
    } else {
        parts.push(arrowRight);
    }

    if (page === 1) {
        parts.push(arrowRight);
    } else {
        parts.push(arrowRightActive);
    }
    if (pages > 1) {
        if (page > 6) {
            query.set("page", "1");
            parts.push($("<li><a href=\"#\" class=\"numbered-page\" data-page-id=\"1\">1</a></li>"), $("<li class=\"more\"><i class=\"fa-solid fa-ellipsis\"></i></li>"));
        }
        for (let i = page - 4; i < page; i++) {
            if (i >= 1) {
                query.set("page", String(i));
                parts.push($(`<li><a href="#" class="numbered-page" data-page-id="${i}">${i}</a></li>`));
            }
        }
    }
    parts.push($(`<li class="current-page"><span>${page}</span></li>`));
    if (pages > 1) {
        for (let i = page + 1; i < page + 5; i++) {
            if (i <= pages) {
                query.set("page", String(i));
                parts.push($(`<li><a href="#" class="numbered-page" data-page-id="${i}">${i}</a></li>`));
            }
        }
        if (page + 5 !== pages) {
            parts.push($("<li class=\"more\"><i class=\"fa-solid fa-ellipsis\"></i></li>"));
        }
        if (page !== pages) {
            query.set("page", String(pages));
            parts.push($(`<li><a href="#" class="numbered-page" data-page-id="${pages}">${pages}</a></li>`));
        }
    }
    if (page === pages) {
        parts.push(arrowLeft);
    } else {
        parts.push(arrowLeftActive);
    }
    for (const part of parts) {
        part.appendTo(menu);
    }
    menu.appendTo(div);
    div.on("click", "a.numbered-page, li.arrow a", async event => {
        event.preventDefault();
        const $target = $(event.currentTarget);
        const newPage = Number($target.attr("data-page-id"));
        if (!isNaN(newPage)) {
            await setPage(newPage);
        }
    });
    div.insertAfter($table);
}

function getSearchForm() {
    return $("form.simple_form.inline-form[action='/pools']");
}

function getTags() {
    return getSearchForm().find("input[name='search[tags]']").val() as string | undefined;
}

async function reinitSearch() {
    const tags = getTags();
    if (!tags) {
        return;
    }

    const $tbody = $("table.striped tbody");
    $tbody.find("tr").remove();
    $tbody.append("<tr><td></td><td>Loading...</td><td></td></tr>");

    const perPage = await getCurrentUserPerPage();
    const pools = await search(getSearchForm());
    $tbody.find("tr").remove();
    for (const p of pools.pools) {
        const tr = makeSearchEntry(p, perPage);
        tr.appendTo($tbody);
    }
    if (pools.pools.length === 0) {
        $tbody.append("<tr><td></td><td>No Results Found</td><td></td></tr>");
    }
    reinitPagination(Math.ceil(pools.total / perPage));
}

function makeSearchEntry(pool: Pool, perPage: number) {
    const pages = Math.ceil(pool.post_ids.length / perPage);
    const prettyName = pool.name.replaceAll("_", " ");
    const tr = $(`<tr id="pool-${pool.id}" class="pool-category-${pool.category}"></tr>`);
    const empty = $("<td></td>");
    let link: JQuery<HTMLElement>;
    if (pages === 1) {
        link = $(`<td><a href="/pools/${pool.id}">${prettyName}</a></td>`);
    } else {
        const link1 = $(`<a href="/pools/${pool.id}">${prettyName}</a>`);
        const link2 = $(`<a href="/pools/${pool.id}?page=${pages}" class="last-page">page ${pages}</a>`);
        link = $("<td></td>");
        link1.appendTo(link);
        link.append(" ");
        link2.appendTo(link);
    }
    const postCount = $(`<td>${pool.post_ids.length}</td>`);
    empty.appendTo(tr);
    link.appendTo(tr);
    postCount.appendTo(tr);
    return tr;
}

async function getCurrentUser() {
    const r = await GM.xmlHttpRequest({
        method: "GET",
        url:    "https://e621.net/users/upload_limit.json"
    });
    if (r.status !== 200) {
        return null;
    }
    return JSON.parse(r.responseText) as CurrentUser;
}

async function getCurrentUserPerPage() {
    const current = await GM.getValue<[per_page: number, expiry: number]>("per_page");
    if (current && current[1] > Date.now()) {
        return current[0];
    }
    const per_page = await getCurrentUser().then(u => u?.per_page || 75);
    await GM.setValue("per_page", [per_page, Date.now() + 1000 * 60 * 60 * 24]);
    return per_page;
}

function addHiddenPageInput($form: JQuery<HTMLElement>) {
    const page = getPage();
    const input = $("<input type=\"hidden\" name=\"page\">");
    input.val(page);
    input.appendTo($form);
}

function addTagsSearch($form: JQuery<HTMLElement>) {
    const div = $("<div class=\"input string optional search_tags\"><label class=\"string optional\" for=\"search_tags\">Tags</label><input id=\"search_tags\" class=\"string optional ui-autocomplete-input\" data-autocomplete=\"tag-query\" type=\"text\" name=\"search[tags]\" autocomplete=\"off\"></div>");
    if (window.location.search) {
        const tags = new URLSearchParams(window.location.search).get("search[tags]");
        if (tags) {
            div.find("input").val(tags);
            showSearch();
        }
    }
    div.insertAfter($form.find("div.search_creator_name"));
}

function initFormListener($form: JQuery<HTMLElement>) {
    $form.on("submit", async event => {
        const $target = $(event.target);
        const tags = $target.find("input[name='search[tags]']")?.val() as string;
        if (!tags) {
            return;
        }
        event.preventDefault();

        await reinitSearch();
    });
}

function getQuery($form: JQuery<HTMLElement>) {
    const q = new URLSearchParams();
    $form.find("input,select").each((_, e) => {
        const $e = $(e);
        if ($e.attr("name") !== "commit" && $e.val()) {
            q.append($e.attr("name") as string, $e.val() as string);
        }
    });
    return q;
}

async function search($form: JQuery<HTMLElement>) {
    const q = getQuery($form);
    q.set("limit", String(await getCurrentUserPerPage()));
    const r = await GM.xmlHttpRequest({
        method: "GET",
        url:    `${baseURL}?${q.toString()}`
    });
    if (r.status !== 200) {
        const json = JSON.parse(r.responseText) as ErrorResponse;
        Danbooru.error(`Failed to fetch pools: ${json.message} (${json.code ?? "no code"})`);
        return { pools: [], total: 0 } satisfies PoolResponse;
    }
    const json = JSON.parse(r.responseText) as PoolResponse;
    $form.find("input[type=submit]").removeAttr("disabled");
    window.history.replaceState(null, document.title, `?${q.toString()}`);
    return json;
}

function getPage() {
    return Number(new URLSearchParams(window.location.search).get("page") ?? "1");
}

async function setPage(page: number) {
    const query = new URLSearchParams(window.location.search);
    query.set("page", String(page));
    window.history.replaceState(null, document.title, `?${query.toString()}`);
    const $form = getSearchForm();
    $form.find("input[name='page']").val(page);
    reinitPagination(0);
    await reinitSearch();
}

function showSearch() {
    const $searchForm = $("#searchform");
    const $searchShow = $("#search-form-show-link");
    const $searchHide = $("#search-form-hide-link");
    if ($searchForm.length !== 0 && $searchForm.is(":hidden")) {
        $searchForm.fadeIn("fast");
        $searchShow.hide();
        $searchHide.show();
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hideSearch() {
    const $searchForm = $("#searchform");
    const $searchShow = $("#search-form-show-link");
    const $searchHide = $("#search-form-hide-link");
    if ($searchForm.length !== 0 && $searchForm.is(":visible")) {
        $searchForm.fadeOut("fast");
        $searchShow.show();
        $searchHide.hide();
    }
}
