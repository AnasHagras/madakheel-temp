import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, FormGroup, Row, Form, FormControl, Button } from "react-bootstrap";
import Link from "next/link";
import Seo from "../../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
import trash from "../../../../public/assets/img/trash.png";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";


const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const Page = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [numberOfUnreadMessages, setNumberOfUnreadMessages] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState({});
    const [selectedUser, setSelectedUser] = useState([]);
    const [singleMessage, setSingleMessage] = useState();
    const [search, setSearch] = useState('');
    const [update, forceUpdate] = useReducer((x) => x + 1, 0);
    const [addAccountantPopup, setAddAccountantPopup] = useState(false);
    const [editAccountantPopup, setEditAccountantPopup] = useState(false);
    const [deletePopup, setDeletePopup] = useState(false);
    const user = getUserCookies();
    const { token, id, user_type } = user;
 
    const [isCanAdd, setIsCanAdd] = useState(false);
    const [isCanDelete, setIsCanDelete] = useState(false);
    const [isCanUpdate, setIsCanUpdate] = useState(false);


    useEffect(() => {
        if (user_type === "ACC") {
            const permissions = JSON.parse(localStorage.getItem("permissions"))
            const componentPermissions = permissions?.filter(
                (permission) => permission.group_name === 'المسوقين'
            );

            const canAdd = componentPermissions?.some((permission) => permission.display_name === 'اضافة');
            const canDelete = componentPermissions?.some((permission) => permission.display_name === 'حذف');
            const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');

            setIsCanAdd(canAdd);
            setIsCanDelete(canDelete);
            setIsCanUpdate(canUpdate);
        }
    }, [user]);
    useEffect(() => {
        fetch(`${baseUrl}/api/v1/get_marketer/?search=${search}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        })
            .then((res) => {
                if (res.status === 401) {
                    logout();
                    return;
                }
                return res.json();
            })
            .then((data) => {
                setData(data);
            })
            .catch(err => toast.error('Error fetching data'));
    }, [search, update]);

    useEffect(() => {
        if (selectedMessage >= 0) {
            fetch(`${baseUrl}/api/v1/contact_customer_support/${selectedMessage}/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    setSingleMessage(data.data.item);
                    setNumberOfUnreadMessages(data.data.number_of_unread_messages);
                })
                .catch(err => toast.error('Error fetching message'));
        }
    }, [selectedMessage]);

    const addMarketeer = async (e, data) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/v1/marketer-register/`, {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
            });
            if (res.status == 401) {
                logout()
            }
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("تم إنشاء المسوق بنجاح");
                setAddAccountantPopup(false);
                forceUpdate();
            } else {
                toast.error(result.message || result.error || result.detail || "حدث خطأ ما");
            }
        } catch (error) {
            toast.error("Error adding marketer");
        }
        setLoading(false);
    };

    const editeMarketeer = async (e, data) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/v1/get_marketer/${selectedMessage.id}/`, {
                method: "PATCH",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
            });
            if (res.status == 401) {
                logout()
            }
            const result = await res.json();
            if (res.ok) {
                toast.success("تم تعديل المسوق بنجاح");
                setEditAccountantPopup(false);
                forceUpdate();
            } else {
                toast.error(result.message || result.error || result.detail || "حدث خطأ ما");
            }
        } catch (error) {
            toast.error("Error editing marketer");
        }
        setLoading(false);
    };
    const deleteUser = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/v1/delete_marketer/${id}/`, {
                method: "DELETE",
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                },
            });
            if (res.status == 401) {
                logout()
            }
            const result = await res.json();
            if (res.ok) {
                toast.success("تم الحذف بنجاح");
                forceUpdate();
                setDeletePopup(false);
            } else {
                toast.error(result.message || result.error || result.detail || "حدث خطأ ما");
            }
        } catch (error) {
            toast.error("Error deleting marketer");
        }
        setLoading(false);
    };

    return (
        <>
            <Seo title='  المسوقون ' />

            <PageHeader
                title='  المسوقون '
                item='شركة وحيد'
                active_item='  المسوقون '
            />

            <div className="bg-white  p-2 ">
                {/* <!-- Row --> */}

                <Row className='row-sm ps-2 messages'>
                    <Col lg={12} md={12} className="ps-4 p-1 ">
                        <span className=""> المسوقون</span>
                        {
                            user_type === "ADM" || isCanAdd ?

                                <button onClick={() => setAddAccountantPopup(true)} className="p-2  px-4 border ms-4  bg-white shadow rounded-3">+ اضافة</button>
                                : ''
                        }
                    </Col>
                    <Col lg={3} md={4}>
                        <div className=" rounded-5  " style={{ height: '65vh', overflow: 'auto', backgroundColor: '#e2e2e266' }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <input
                                    type='text'
                                    className=' p-2 rounded-5  bg-white  mb-4 mt-1'
                                    style={{ width: '90%' }}
                                    placeholder='بحث'
                                    value={search}
                                    onChange={(e) => {
                                        setSelectedMessage({})
                                        setSearch(e.target.value)
                                    }}
                                />
                            </div>
                            {data.map((data, index) => {
                                return (


                                    <div key={index} className={selectedMessage == data ? 'mb-2 p-2 d-flex items-center active' : 'mb-2 p-2 d-flex items-center'} style={{ cursor: "pointer" }} onClick={() => setSelectedMessage(data)}>
                                        <span className="ti-user  p-2 bg-white rounded-circle"></span>
                                        <span className="d-flex align-items-center">
                                            <span className={data.is_read ? 'ms-2 ' : 'ms-2 fw-bold'}>{data.name}</span>
                                            <span className="ms-2">-</span>
                                            <span className={data.is_read ? 'ms-2 ' : 'ms-2 fw-bold'}>{data.mobile}</span>

                                        </span>
                                    </div>
                                )

                            })}




                        </div>
                    </Col>
                    <Col lg={9} md={8}>
                        {
                            console.log("selectedMessage", selectedMessage)
                        }


                        <div className="p-4 d-flex flex-column gap-3">



                            {
                                selectedMessage.total_deserve > -1 &&
                                <>
                                    <div className="text-primary d-flex justify-content-between ">
                                        <div>
                                            <div className="ms-2">{singleMessage?.name}</div>
                                            <div className="ms-2">{singleMessage?.mobile}</div>
                                        </div>
                                        <div className="d-flex">
                                            {
                                                user_type === "ADM" || isCanUpdate ?

                                                    <button onClick={() => setEditAccountantPopup(true)} style={{ width: '90px' }} className="p-2 px-3  border m-1  bg-white shadow rounded-3 text-center d-flex justify-content-between align-items-center">

                                                        <i className="ti-pencil-alt"></i>


                                                        <span>تعديل</span>
                                                    </button>
                                                    : ''
                                            }
                                            {
                                                user_type === "ADM" || isCanDelete ?

                                                    <button onClick={() => setDeletePopup(true)} style={{ width: '80px' }} className="p-2 px-3  border m-1  bg-white shadow rounded-3 text-center d-flex justify-content-between align-items-center">

                                                        <i className="ti-trash"></i>


                                                        <span>حذف</span>
                                                    </button>
                                                    : ''
                                            }
                                        </div>
                                    </div>
                                    <div className="text-primary d-flex justify-content-between fs-5 row">
                                        <div className="col-12 word-break break-word overflow-hidden col-lg-3 col-md-4  border rounded-2 shadow py-4 px-2 d-flex justify-content-between">
                                            <span>الاستحقاق</span>
                                            <span>:</span>
                                            <span>
                                                <span>{selectedMessage.total_deserve}</span>
                                                <span> ريال</span>
                                            </span>

                                        </div>
                                        <div className="col-12 word-break break-word overflow-hidden col-lg-3 col-md-4 border rounded-2 shadow py-4 px-3 d-flex justify-content-between">
                                            <span>عدد العملاء</span>
                                            <span>:</span>
                                            <span>
                                                <span>{selectedMessage.total_users}</span>

                                            </span>

                                        </div>
                                        <div className="col-12 word-break break-word overflow-hidden col-lg-3 col-md-4 border rounded-2 shadow py-4 px-3 d-flex justify-content-between">
                                            <span>عدد الشراء</span>
                                            <span>:</span>
                                            <span>
                                                <span>151545</span>

                                            </span>

                                        </div>

                                    </div>
                                    <div className="text-primary d-flex justify-content-between fs-6 row">
                                        <div className="col-12 col-lg-6 col-md-12  py-4 px-2  ">
                                            <h6 className="fs-5">العملاء</h6>

                                            <div className=" rounded-5  " style={{ width: '280px', height: '50vh', overflow: 'auto', backgroundColor: '#e2e2e266' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <input
                                                        type='text'
                                                        className=' p-2 rounded-5  bg-white  mb-4 mt-1'
                                                        style={{ width: '90%' }}
                                                        placeholder='بحث'
                                                        value={search}
                                                        onChange={(e) => {
                                                            setSelectedMessage(-1)
                                                            setSearch(e.target.value)
                                                        }}
                                                    />
                                                </div>
                                                {Object.entries(selectedMessage.marketer_deserves).map(([item, value]) => {
                                                    return (


                                                        <div key={item} className={selectedUser == value ? 'mb-2 p-2 d-flex items-center active' : 'mb-2 p-2 d-flex items-center'} style={{ cursor: "pointer" }} onClick={() => setSelectedUser(value)}>
                                                            <span className="ti-receipt p-2 bg-white rounded-circle"></span>
                                                            <span className="d-flex align-items-center">
                                                                <span className={item.is_read ? 'ms-2' : 'ms-2 fw-bold'}>{value[0]?.user.name}</span>
                                                                <span className="ms-2">-</span>
                                                                <span className={item.is_read ? 'ms-2' : 'ms-2 fw-bold'}>{item}</span>
                                                            </span>
                                                        </div>
                                                    )

                                                })}




                                            </div>

                                        </div>
                                        <div className="col-12 col-lg-6 col-md-12 py-4 px-3 ">
                                            <h6 className="fs-5">عمليات الشراء</h6>
                                            <div className=" rounded-5  " style={{ height: '50vh', overflow: 'auto', backgroundColor: '#e2e2e266' }}>

                                                {selectedUser?.map((data, index) => {
                                                    return (


                                                        <div key={index} className={'mb-2 p-2 d-flex items-center'} style={{ cursor: "pointer" }} onClick={() => setSelectedMessage(data.id)}>
                                                            <span className="ti-receipt  p-2 bg-white rounded-circle"></span>
                                                            <span className="d-flex align-items-center">
                                                                <span className={'ms-2 fw-bold'}>{data.purchase_package_spec_sale.purchase_package_spec.quantity}</span>
                                                                <span className="ms-2">-</span>
                                                                <span className={'ms-2 fw-bold'}>من {data.purchase_package_spec_sale.purchase_package_spec.package_spec.title} </span>
                                                                <span className={'ms-2 fw-bold'}>{data.purchase_package_spec_sale.purchase_package_spec.quantity * data.purchase_package_spec_sale.purchase_package_spec.package_spec.price}</span>

                                                            </span>
                                                        </div>
                                                    )

                                                })}




                                            </div>

                                        </div>

                                    </div>
                                </>


                            }


                        </div>


                    </Col>
                </Row>
                {/* <!-- End Row --> */}
            </div>

            {addAccountantPopup && (
                <AddAccountantPopup
                    setAddAccountantPopup={setAddAccountantPopup}
                    addMarketeer={addMarketeer}
                    loading={loading}
                />
            )}
            {editAccountantPopup && (
                <EditAccountantPopup
                    setEditAccountantPopup={setEditAccountantPopup}
                    editeMarketeer={editeMarketeer}
                    marketeerData={selectedMessage}
                    loading={loading}
                />
            )}
            {deletePopup && (
                <DeletePopup
                    loading={loading}
                    setDeletePopup={setDeletePopup}
                    marketeerData={selectedMessage}
                    deleteUser={deleteUser}
                />
            )}
        </>
    );
};

Page.layout = "Contentlayout";

export default Page;
const AddAccountantPopup = ({
    setAddAccountantPopup,
    addMarketeer,
    loading,
}) => {
    const [mobile, setMobile] = useState(null);
    const [countryCode, setCountryCode] = useState([]);
    const [selectedCode, setSelectedCode] = useState(1); // Default to Saudi Arabia
    const [appleLink, setAppleLink] = useState(null);
    const [name, setName] = useState(null);
    const [androidLink, setAndroidLink] = useState(null);
    useEffect(() => {


        const fetchCountryCode = async () => {
          try {
            const res = await fetch(`${baseUrl}/api/v1/country-code/`, {
    
            });
            const data = await res.json();
            console.log(data);
    
            setCountryCode(data);
    
          } catch (error) {
            console.error("Error fetching stats:", error);
          } 
        };
    
        fetchCountryCode();
      }, []);

    return (
        <div
            style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
            className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
        >
            <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
                <Card.Header>
                    <h3>إنشاء مسوق جديد</h3>
                </Card.Header>
                <Card.Body>
                    <Form
                        onSubmit={(e) =>
                            addMarketeer(e, {
                                mobile,
                                appleLink,
                                name,
                                androidLink,
                                country_code: JSON.parse(selectedCode),
                            })
                        }
                    >
                        <Form.Group className='text-start form-group' controlId='formEmail'>
                            <Form.Label>الاسم</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل إسم المسوق '
                                name='name'
                                type='text'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group className='text-start form-group' controlId='formEmail'>
                            <Form.Label>الجوال</Form.Label>
                            <div className="d-flex gap-1">
                                <Form.Select
                                    value={selectedCode}
                                    onChange={(e) => setSelectedCode(e.target.value)}
                                    className="form-control w-25"
                                    style={{ paddingRight: '35px', paddingLeft: "5px" }}
                                >
                                    {countryCode.map((country) => (
                                        <option key={country.id} value={country.id} className="p-4">
                                            ({country.code})
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control
                                    className='form-control'
                                    placeholder='ادخل جوال المسوق '
                                    name='mobile'
                                    type='number'
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    required
                                />
                            </div>

                        </Form.Group>


                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label>رابط أبل</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل رابط أبل  '
                                name='appleLink'
                                type='text'
                                value={appleLink}
                                onChange={(e) => setAppleLink(e.target.value)}

                            />
                        </Form.Group>
                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label>رابط  أندرويد</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل رابط أندرويد '
                                name='androidLink'
                                type='text'
                                value={androidLink}
                                onChange={(e) => setAndroidLink(e.target.value)}

                            />
                        </Form.Group>

                        <div className='d-flex gap-4'>
                            <Button
                                disabled={loading}
                                type='submit'
                                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                            >
                                {loading ? "جار الإنشاء ..." : " إنشاء المسوق"}
                            </Button>
                            <Button
                                onClick={() => setAddAccountantPopup(false)}
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
const EditAccountantPopup = ({
    setEditAccountantPopup,
    marketeerData,
    editeMarketeer,
    loading,
}) => {
    const [appleLink, setAppleLink] = useState(marketeerData.marketer_ios_url);
    const [androidLink, setAndroidLink] = useState(marketeerData.marketer_android_url);

    return (
        <div
            style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
            className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
        >
            <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
                <Card.Header>
                    <h3>تعديل مسوق </h3>
                </Card.Header>
                <Card.Body>
                    <Form
                        onSubmit={(e) =>
                            editeMarketeer(e, {

                                marketer_ios_url: appleLink,

                                marketer_android_url: androidLink,
                            })
                        }
                    >



                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label>رابط أبل</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل رابط أبل  '
                                name='appleLink'
                                type='text'
                                value={appleLink}
                                onChange={(e) => setAppleLink(e.target.value)}

                            />
                        </Form.Group>
                        <Form.Group
                            className='text-start form-group'
                            controlId='formpassword'
                        >
                            <Form.Label>رابط  أندرويد</Form.Label>
                            <Form.Control
                                className='form-control'
                                placeholder='ادخل رابط أندرويد '
                                name='androidLink'
                                type='text'
                                value={androidLink}
                                onChange={(e) => setAndroidLink(e.target.value)}

                            />
                        </Form.Group>

                        <div className='d-flex gap-4'>
                            <Button
                                disabled={loading}
                                type='submit'
                                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                            >
                                {loading ? "جار التعديل ..." : " تعديل المسوق"}
                            </Button>
                            <Button
                                onClick={() => setEditAccountantPopup(false)}
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

const DeletePopup = ({ setDeletePopup, marketeerData, loading, deleteUser }) => {
    return (
        <div
            style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
            className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
        >
            <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
                <Card.Body className='text-center'>
                    <h4>هل انت متاكد من حذف المسوق : {marketeerData?.name}</h4>
                    <img src={trash.src} alt='trash' width={80} className='my-4' />
                    <div className='d-flex justify-content-center gap-5'>
                        <button
                            className='btn btn-lg btn-danger px-5 '
                            onClick={() => deleteUser(marketeerData?.id)}
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

