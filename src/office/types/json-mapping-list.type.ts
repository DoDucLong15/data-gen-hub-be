export type SheetListType = {
  name?: string; //để trống tức là sheet bất kì đang được active | *index là theo số thứ tự sheet bắt đầu từ *0, *1, có tác dụng với cả sheet ẩn
  visible?: boolean; // [true|false]. Chỉ áp dụng với db2excel, db2list để hiện/ẩn sheet sau khi ghi giữ liệu
  mapping: {
    dbTableName?: string; //Tên bảng dữ liệu trong cơ sở dữ liệu (Hiện tại chỉ dùng bảng student - Phát triển thêm sau)
    rows?: string /* Phạm vi trong file excel, từ dòng ... tới dòng .... list2db dùng cả 2 tham số. Với list2db.py, cho phép thiết lập 2:*, hoặc *:6 để phần mềm tự tìm dòng đầu, dòng cuối, hoặc cả 2. Đối với db2list.py chỉ dùng chỉ số đầu như là dòng đầu tiên xuất ra. */;
    columns: {
      column: string;
      dbfield?: string;
      const?: string;
    }[];
  };
};

export type JsonMappingListType = {
  config?: {
    nameFormat?: string[]; // Kí tự đầu tiên ? báo hiệu lấy theo dbfiled, nếu không có là hằng kí tự.
  };
  sheets: SheetListType[];
};
