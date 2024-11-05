class Paginate {
    #defaultStyle = 'tailwind';
    constructor() {
    }

    getStyle() {
        return this.#defaultStyle;
    }

    useBootstrap() {
        this.#defaultStyle = 'bootstrap';
    }
}

module.exports = new Paginate();