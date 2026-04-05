import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
    Button,
    Card,
    Col,
    Form,
    OverlayTrigger,
    Row,
    Tooltip,
} from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
    ssr: false,
});
const DataTableExtensions = dynamic(
    () => import("react-data-table-component-extensions"),
    { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { toast } from "react-toastify";
// images
import * as XLSX from 'xlsx';
import trash from "../../../../public/assets/img/trash.png";
import checkUserType from "../../../../utils/checkUserType";
import { useRouter } from "next/router";

const DeletePopup = ({ setDeletePopup, userData, loading, deleteRow }) => {
    return (
        <div
            style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
            className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
        >
            <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
                <Card.Body className='text-center'>
                    <h4>هل انت متاكد من حذف المنتج : {userData?.title}</h4>
                    <img src={trash.src} alt='trash' width={80} className='my-4' />
                    <div className='d-flex justify-content-center gap-5'>
                        <button
                            className='btn btn-lg btn-danger px-5 '
                            onClick={() => deleteRow(userData?.id)}
                            disabled={loading}
                            style={{ minWidth: "fit-content" }}
                        >
                            {loading ? "جاري الحذف ..." : "حذف"}
                        </button>
                        <button
                            className='btn btn-lg btn-outline-dark px-5'
                            onClick={() => setDeletePopup(false)}
                        >
                            إلغاء
                        </button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

import { getUserCookies } from "../../../../utils/getUserCookies";

const user = getUserCookies();

const Orders = () => {
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const [suspendPopup, setSuspendPopup] = useState(false);
    const [activatePopup, setActivatePopup] = useState(false);
    const [addProductPopup, setAddProductPopup] = useState(false);
    const [isAddNew, setIsAddNew] = useState(true);
    const [update, forceUpdate] = useReducer((x) => x + 1, 0);

    const { token, id, user_type } = user;
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "table.xlsx");
    };
    useEffect(() => {
        fetch(`http://192.34.59.161/api/v1/dashboard/sliders/`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: ` ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => setData(data.results));
    }, [search, update]);

    const deleteRow = async (id) => {
        setLoading(true);
        const res = await fetch(`http://192.34.59.161/api/v1/dashboard/sliders/${id}/`, {
            method: "DELETE",
            headers: {
                // "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
        });


        console.log(res);
        if (res.ok) {
            toast.success("تم الحذف بنجاح");
            forceUpdate();
            setDeletePopup(false);
        } else {
            toast.error(result.message || "حدث خطأ ما");
        }

        setLoading(false);

    };
    const addImage = async (e, data) => {
        e.preventDefault();
        setLoading(true);

        const {  title, desc, link, files } = data;

        const fd = new FormData();
        fd.append("category", "home");
        fd.append("title", title);
        fd.append("description", desc);
        fd.append("link", link);


        files?.length > 0 && fd.append("image", files[0]);

        const res = await fetch(`http://192.34.59.161/api/v1/dashboard/sliders/${!isAddNew ? userData.id + '/' : ""}`, {
            method: isAddNew ? "POST" : "PATCH",
            body: fd,
            headers: {
                Authorization: ` ${token}`,
            },
        });

        const result = await res.json();

        if (res.ok) {
            toast.success("تم الإضافة بنجاح");
            forceUpdate();
            setAddProductPopup(false);
        } else {
            toast.error(result.message || "حدث خطأ ما");
        }

        setLoading(false);
        e.target.reset();
    };

    const columns = [
        {
            name: "المعرف",
            selector: (row) => [+row.id],
            sortable: true,
            cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
        },

        {
            name: "الاسم",
            selector: (row) => [row.title],
            cell: (row) => (
                <Link
                    className='font-weight-bold'
                    href={`/dashboard/pages/products/`}
                >
                    {row.title}
                </Link>
            ),
            sortable: true,
        },
        {
            name: "الوصف",
            selector: (row) => [row.description],
            sortable: true,
            cell: (row) => (
                <div className='font-weight-bold'>{row.description}</div>
            ),
        },
        {
            name: "الرابط",
            selector: (row) => [row.link],
            sortable: true,
            cell: (row) => <div>{row.link}</div>,
        },


        {
            name: " الصورة",
            selector: (row) => [row.image],
            cell: (row) => (
                <div className='d-flex my-auto'>
                    <span className='my-auto'>
                        {/* <img src={row.image} className="header-brand-img desktop-logo" alt="logo1" height="35" style="transform: scale(2.5);" /> */}
                        <img
                            src={row.image}
                            className='my-3'
                            alt='logo'
                            height={100}
                        />
                    </span>
                </div>
            ),

            sortable: true,
        },
        {
            name: "حذف",
            selector: (row) => [row.ACTIONS],
            cell: (row) => (
                <div
                    className='button-list '
                    onClick={() => {
                        setDeletePopup(true);
                        setUserData(row);
                    }}
                >
                    <OverlayTrigger
                        placement={row.Placement}
                        overlay={<Tooltip> حذف</Tooltip>}
                    >
                        <i className='ti ti-trash btn'></i>
                    </OverlayTrigger>
                </div>
            ),
        },
        {
            name: "تعديل",
            selector: (row) => [row.ACTIONS],
            cell: (row) => (
              <div
                className='button-list '
                onClick={() => {
                  setIsAddNew(false)
                  setAddProductPopup(true);
                  setUserData(row);
                }}
              >
                <OverlayTrigger
                  placement={row.Placement}
                  overlay={<Tooltip> تعديل</Tooltip>}
                >
                  <i className='ti ti-pencil btn'></i>
                </OverlayTrigger>
              </div>
            ),
          },
    ];

    const tableData = {
        columns,
        data,
    };

    const isAdmin = checkUserType();

    const router = useRouter();

    return (
        <>
            <Seo title='صور السلايدر' />

            <PageHeader title='صور السلايدر' item='شركة وحيد' active_item='صور السلايدر' />

            <div>

                {/* <!-- Row --> */}
                <Row className='row-sm'>
                    <Col md={12} lg={12}>
                        <Card className=' custom-card'>
                            <Card.Header className=' border-bottom-0 pb-10'>
                                <div style={{ marginBottom: "-5px" }}>
                                    <div className='d-flex justify-content-between '>
                                        <label className='main-content-label my-auto'>
                                            صور السلايدر
                                        </label>
                                        <Button onClick={exportToExcel}>Export to Excel</Button>
                                        {isAdmin === true ? (

                                            <Button
                                                onClick={() =>{
                                                    
                                                    setIsAddNew(true)
                                                    setAddProductPopup(true)
                                                }
                                                   
                                                }
                                            >
                                                إضافة صورة 
                                            </Button>
                                        ) : (
                                            <div className='py-3'></div>
                                        )}


                                    </div>
                                    <input
                                        type='text'
                                        className='search-input'
                                        placeholder='بحث'
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <DataTableExtensions {...tableData}>
                                    <DataTable
                                        columns={columns}
                                        defaultSortAsc={false}
                                        // striped={true}
                                        pagination
                                        paginationPerPage={200}
                                        paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                                    />
                                </DataTableExtensions>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {/* <!-- End Row --> */}
            </div>

            {deletePopup && (
                <DeletePopup
                    loading={loading}
                    setDeletePopup={setDeletePopup}
                    userData={userData}
                    deleteRow={deleteRow}
                />
            )}

            {addProductPopup && (
                <AddProductPopup
                    loading={loading}
                    setAddProductPopup={setAddProductPopup}
                    addImage={addImage}
                    token={token}
                    userData={userData}
                    isAddNew={isAddNew}
                />
            )}
        </>
    );
};

Orders.layout = "Contentlayout";

export default Orders;

const AddProductPopup = ({ setAddProductPopup, addImage, loading, token,userData, isAddNew  }) => {
   
    const [link, setLink] = useState(!isAddNew ? userData.link : null);
   
    const [files, setFiles] = useState(null);
    const [title, setTitle] = useState(!isAddNew ? userData.title : null);
    const [desc, setDesc] = useState(!isAddNew ? userData.description : null);
 
    return (
        <div
            style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
            className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
        >
            <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
                <Card.Header>
                    
                    {isAddNew ? <h3>صورة جديدة</h3> : <h3>تعديل الصورة </h3>}
                </Card.Header>
                <Card.Body>
                    <Form
                        onSubmit={(e) =>
                            addImage(e, {
                                link,
                                files,
                                title,
                                desc,
                            })
                        }
                    >
                        <Form.Group className='text-start form-group' controlId='formEmail'>
                            <Form.Label>العنوان</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل الاسم'
                                name='title'
                                type='text'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className='text-start form-group' controlId='formEmail'>
                            <Form.Label>الرابط</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل الرابط'
                                name='title'
                                type='text'
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                required
                            />
                        </Form.Group>
                       


                     
                      

                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label> إرفاق الصورة  </Form.Label>
                            <Form.Control
                                className='form-control'
                                name='files'
                                type='file'
                                multiple
                                onChange={(e) => setFiles(e.target.files)}
                            />
                        </Form.Group>
                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label>الوصف</Form.Label>
                            <textarea
                                className='form-control'
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                rows={5}
                                placeholder='ادخل الوصف'
                            />
                        </Form.Group>
                        <div className='d-flex gap-4'>
                            <Button
                                disabled={loading}
                                type='submit'
                                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                            >
                                {loading ? "جار الإضافة..." : isAddNew ? "إضافة صورة جديدة" : "تعديل"}
                            </Button>
                            <Button
                                onClick={() => setAddProductPopup(false)}
                                type='button'
                                className='btn ripple btn-main-primary btn-block mt-2 '
                            >
                                الغاء
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};