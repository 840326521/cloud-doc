import { ObservableSet } from "mobx";
import { useEffect, useState } from "react";

const useSortOpenIDs = (activeFileID: string, openFileIDs: ObservableSet<string>): returnUseSortOpenIDsType => {
    const [sortOpenFileIDs, setSortOpenFileIDs] = useState<string[]>([]);
    useEffect(() => {
        if (activeFileID.trim() !== "" && !sortOpenFileIDs.includes(activeFileID)) {
            setSortOpenFileIDs((prevSortOpenFileIDs) => [activeFileID, ...prevSortOpenFileIDs]);
        }
    }, [activeFileID, sortOpenFileIDs]);
    useEffect(() => {
        if (openFileIDs.size <= 0) {
            setSortOpenFileIDs([])
            return
        }
        setSortOpenFileIDs(sortOpenFileIDs.filter((fileID) => openFileIDs.has(fileID)))
    }, [openFileIDs.size]);
    return { sortOpenFileIDs, setSortOpenFileIDs };
};

type returnUseSortOpenIDsType = {
    sortOpenFileIDs: string[];
    setSortOpenFileIDs: React.Dispatch<React.SetStateAction<string[]>>;
};

export default useSortOpenIDs;
