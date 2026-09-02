const getCyclicResultPage = (currentPage, itemCount, pageSize, step) => {
    const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
    return ((currentPage - 1 + step) % pageCount + pageCount) % pageCount + 1;
};

export {
    getCyclicResultPage,
};
