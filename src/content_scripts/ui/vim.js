const addLineBoundaryMappings = (vim) => {
    ["normal", "visual", "operatorPending"].forEach((context) => {
        vim.map("gh", "^", context);
        vim.map("gl", "$", context);
    });
};

export {
    addLineBoundaryMappings,
};
