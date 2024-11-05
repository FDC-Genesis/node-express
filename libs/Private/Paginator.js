const Configure = require("../Service/Configure");
const LoadModel = require("../Service/LoadModel");
const Paginate = require("./Paginate");

class Paginator {
    paginator = {};
    #count = null;
    #req = null;
    #page = null;
    #style;
    constructor(req) {
        this.#req = req;
        this.#count = this.#req.query.count || null;
        this.#page = this.#req.query.page || 1;
        this.limit = Configure.read('paginate.paginate_limit') || 10;
        this.#style = Paginate.getStyle();
    }

    async paginate(model, paginator) {
        this.paginator = paginator;
        if (!model) {
            throw new Error('Model name is required for pagination');
        }
        if (!this[model]) {
            this[model] = LoadModel.init(model);
        }
        const query = this.paginator[model];
        query['offset'] = (this.#page - 1) * this.limit;
        query['limit'] = this.limit;
        if (!this.#count) {
            this.#count = await this[model].find('count', query);
        }
        let data = {};
        data[model] = await this[model].find('all', query) || [];
        data['current_page'] = this.#page;
        data['total_pages'] = Math.ceil(this.#count / this.limit);
        data['links'] = this.#links(data['current_page']);
        return data;
    }
    #links(current_page) {
        const baseUrl = `${this.#req.protocol}://${this.#req.get('host')}${this.#req.baseUrl}${this.#req.path}`;
        const totalPages = Math.ceil(this.#count / this.limit);

        if (current_page > totalPages) {
            return '';
        }

        const maxPageLinks = 10;

        // Determine styles based on the value of this.#style
        const isBootstrap = this.#style === 'bootstrap';
        const paginationClass = isBootstrap ? 'pagination justify-content-center' : 'flex justify-center space-x-2';
        const pageItemClass = isBootstrap ? 'page-item' : 'border rounded';
        const pageLinkClass = isBootstrap ? 'page-link' : 'bg-blue-500 text-white hover:bg-blue-600 px-3 py-1 rounded';

        let links = `
            <nav aria-label="Page navigation">
                <ul class="${paginationClass}">`;

        if (current_page > 1) {
            links += `
                    <li class="${pageItemClass}">
                        <a class="${pageLinkClass}" href="${baseUrl}?page=${current_page - 1}&count=${this.#count}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>`;
        }

        let startPage = Math.max(1, current_page - Math.floor(maxPageLinks / 2));
        let endPage = Math.min(totalPages, startPage + maxPageLinks - 1);

        if (endPage - startPage < maxPageLinks - 1) {
            startPage = Math.max(1, endPage - maxPageLinks + 1);
        }

        if (startPage === endPage) {
            links += `
                <li class="${pageItemClass} active">
                    <a class="${pageLinkClass}" href="javascript:void(0)">${startPage}</a>
                </li>`;
        } else {
            for (let i = startPage; i <= endPage; i++) {
                links += `
                    <li class="${pageItemClass} ${current_page === i ? 'active' : ''}">
                        <a class="${pageLinkClass}" href="${current_page === i ? 'javascript:void(0)' : `${baseUrl}?page=${i}&count=${this.#count}`}">${i}</a>
                    </li>`;
            }
        }

        if (current_page < totalPages) {
            links += `
                    <li class="${pageItemClass}">
                        <a class="${pageLinkClass}" href="${baseUrl}?page=${current_page + 1}&count=${this.#count}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>`;
        }

        links += `
                </ul>
            </nav>`;

        return links.trim();
    }
}

module.exports = Paginator;