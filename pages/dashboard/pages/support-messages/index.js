import React, { useEffect, useReducer, useState } from "react";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import { Card, Col, Row, Form, Button } from "react-bootstrap";
import Link from "next/link";
import Seo from "../../../../shared/layout-components/seo/seo";
import { toast } from "react-toastify";
import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";
import { useRouter } from "next/router";


const Page = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const router = useRouter();
    const { messageId } = router.query;
    const [numberOfUnreadMessages, setNumberOfUnreadMessages] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState(messageId ? messageId : -1);
    const [singleMessage, setSingleMessage] = useState()
    const [reply, setReply] = useState('')
    const [adminNote, setAdminNote] = useState('')
    const [search, setSearch] = useState('');
    const [update, forceUpdate] = useReducer((x) => x + 1, 0);
    const user = getUserCookies();
    const { token, id, user_type } = user;
    const [selectedStatus, setSelectedStatus] = useState('new');
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const [isCanUpdate, setIsCanUpdate] = useState(false);

    const formattedDate = (dateString) => new Date(dateString).toLocaleString("ar-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",


    });
    useEffect(() => {
        if (user_type === "ACC") {
            const permissions = JSON.parse(localStorage.getItem("permissions"))
            const componentPermissions = permissions?.filter(
                (permission) => permission.group_name === 'رسائل الدعم'
            );

            const canUpdate = componentPermissions?.some((permission) => permission.display_name === 'تعديل');


            setIsCanUpdate(canUpdate);
        }
    }, [user]);
    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
    };
    const handleReplyMessage = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${baseUrl}/api/v1/contact_customer_support/${singleMessage.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({
                    "admin_notes": adminNote,
                    "response": reply,
                    "status": 'processed',

                }),
            });
            const result = await res.json();
            if (res.status == 401) {
                logout()
            }
            if (res.status == 200) {

                setReply('')
                setAdminNote('')
                setLoading(false);
                forceUpdate(update + 1);
                toast.success("تم الرد بنجاح   .");
            }
            else {
                console.log(res)
                toast.error(result.message || result.error || result.detail || "حدث خطأ في الرد.");
                setLoading(false);
            }
            // const data = await res.json();
        } catch (error) {
            console.error("Error sending message:", error);
            // toast.error("Failed to send message.");
            setLoading(false);
        }


    }
    // Fetch the initial contract data
    // useEffect(() => {
    //     const fetchContractData = async () => {
    //         try {
    //             const res = await fetch("${baseUrl}/api/v1/last_contract/", {
    //                 headers: {
    //                     Authorization: token,
    //                 },
    //             });
    //             if (res.status == 401) {
    //                 logout()
    //             }
    //             const contractData = await res.json();
    //             // Do something with contractData if needed
    //         } catch (error) {
    //             console.error("Error fetching contract data:", error);
    //             toast.error("Failed to fetch contract data.");
    //         }
    //     };

    //     fetchContractData();
    // }, [token]);

    // Fetch messages based on search
    useEffect(() => {

        const fetchMessages = async () => {
            try {

                const res = await fetch(`${baseUrl}/api/v1/contact_customer_support/?status=${selectedStatus}&search=${search}`, {

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: token,
                    },
                });
                const data = await res.json();
                console.log('llllllllllll', data);
                setData(data.results);
                setNumberOfUnreadMessages(data.number_of_unread_messages);
            } catch (error) {
                console.error("Error fetching messages:", error);

            }
        };

        fetchMessages();
    }, [ update, token, selectedStatus]);
    useEffect(() => {
        if (search.length < 3) {
            // If search term is less than 3 characters, do nothing
            if(search.length == 0){
              setSearch('')
            }
            else  return ;
          }
          
        const fetchMessages = async () => {
            try {

                const res = await fetch(`${baseUrl}/api/v1/contact_customer_support/?status=${selectedStatus}&search=${search}`, {

                    headers: {
                        "Content-Type": "application/json",
                        Authorization: token,
                    },
                });
                const data = await res.json();
                console.log('llllllllllll', data);
                setData(data.results);
                setNumberOfUnreadMessages(data.number_of_unread_messages);
            } catch (error) {
                console.error("Error fetching messages:", error);

            }
        };

        fetchMessages();
    }, [search]);
    useEffect(() => {
        setSelectedMessage(messageId)
    }, [messageId])
    // Fetch single message based on selectedMessage
    useEffect(() => {
        if (selectedMessage >= 0) {
            const fetchSingleMessage = async () => {
                try {
                    const res = await fetch(`${baseUrl}/api/v1/contact_customer_support/${selectedMessage}/`, {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: token,
                        },
                    });
                    const data = await res.json();
                    console.log(data);

                    setSingleMessage(data.data.item);
                    setNumberOfUnreadMessages(data.data.number_of_unread_messages);
                } catch (error) {
                    console.error("Error fetching single message:", error);
                    toast.error("Failed to fetch the selected message.");
                }
            };

            fetchSingleMessage();
        }
    }, [selectedMessage, messageId, token, update, selectedStatus]);

    return (
        <>
            <Seo title="رسائل الدعم" />

            <PageHeader
                title="رسائل الدعم"
                item="شركة وحيد"
                active_item="رسائل الدعم"
            />

            <div className="bg-white p-2">
                <h4 className="fw-bold">رسائل الدعم    <button onClick={() => forceUpdate()} style={{ width: "50px" }} className="p-1 pl-2 pr-2 ms-2 border border-2 bg-white rounded-2" >
                    <svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="16" height="16"><path d="M12,2.99a9.03,9.03,0,0,1,6.36,2.65L15.986,8.014h5.83a1.146,1.146,0,0,0,1.146-1.146V1.038L20.471,3.529A11.98,11.98,0,0,0,0,12H2.99A9.02,9.02,0,0,1,12,2.99Z" /><path d="M21.01,12A8.994,8.994,0,0,1,5.64,18.36l2.374-2.374H1.993a.956.956,0,0,0-.955.955v6.021l2.491-2.491A11.98,11.98,0,0,0,24,12Z" /></svg>


                </button></h4>
                <Row className="row-sm ps-5 messages">
                    <Col lg={12} md={12} className="ps-4 p-2 d-flex justify-content-between align-items-center">
                        <div className="w-md-25 d-flex justify-content-between align-items-center">

                            <span style={{ display: 'block', height: '30px', width: '30px' }} className="  bg-primary  rounded-circle text-center pt-1  ">
                                {numberOfUnreadMessages}
                            </span>
                            <span className="ms-2">غير مقرؤة</span>
                        </div>
                        <Form.Group className='text-start form-group w-md-25 ' controlId='formPackage'>
                            <Form.Label> فرز عن طرق الحالة</Form.Label>
                            <Form.Select
                                className='form-control ps-5 text-muted'
                                name='categories'
                                value={selectedStatus} // Assuming you have state for the selected package
                                onChange={(e) => handleStatusChange(e)}
                                required
                            >
                                {/* Placeholder option */}

                                <option value=""> الكل...</option>
                                <option value="new">جديد  </option>
                                <option value="processed">تم الرد عليها</option>



                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col lg={6} md={5}>
                        <div
                            className="rounded-5"
                            style={{
                                height: '65vh',
                                overflow: 'auto',
                                backgroundColor: '#e2e2e266',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <input
                                    type="text"
                                    className="p-2 rounded-5 bg-white mb-4 mt-1"
                                    style={{ width: '90%' }}
                                    placeholder="بحث"
                                    value={search}
                                    onChange={(e) => {
                                        setSelectedMessage(-1);
                                        setSearch(e.target.value);
                                    }}
                                />
                            </div>
                            {data.map((message, index) => (
                                <div
                                    key={index}
                                    className={
                                        selectedMessage == message.id
                                            ? 'mb-2 p-2 d-flex items-center active'
                                            : 'mb-2 p-2 d-flex items-center'
                                    }
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedMessage(message.id)}
                                >
                                    <span className="ti-user p-2 bg-white rounded-circle"></span>
                                    <span className="d-flex align-items-center">
                                        <span className={message.is_read ? 'ms-2' : 'ms-2 fw-bold'}>
                                            {message?.user ? message?.user?.name : message?.name}
                                        </span>
                                        <span className="ms-2">-</span>
                                        <span className={message.is_read ? 'ms-2' : 'ms-2 fw-bold'}>
                                            {message?.user ? message?.user?.mobile : message?.mobile}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Col>
                    <Col lg={6} md={7}>
                        {selectedMessage >= 0 && (
                            <div className="p-md-4 mt-4 mt-md-0 d-flex flex-column gap-3">
                                <label className="app-label">
                                    <span>العميل :</span>
                                    <span className="text-primary fw-bold">
                                        {singleMessage?.user ? (
                                            <Link
                                                className="font-weight-bold"
                                                href={`/dashboard/pages/users/${singleMessage?.user?.id}/`}
                                            >
                                                <span className="ms-2">{singleMessage?.user?.name}</span>
                                                <span className="ms-2">-</span>
                                                <span className="ms-2">{singleMessage?.user?.mobile}</span>
                                            </Link>
                                        ) : (
                                            <>
                                                <span className="ms-2">{singleMessage?.name}</span>
                                                <span className="ms-2">-</span>
                                                <span className="ms-2">{singleMessage?.mobile}</span>
                                            </>
                                        )}
                                    </span>
                                </label>
                                <label className="app-label d-flex gap-2">
                                    <span>الوقت :</span> <span>{formattedDate(singleMessage?.datetime)}</span>
                                </label>
                                <label className="app-label d-flex flex-column">
                                    <span>الرسالة :</span>
                                </label>
                                <label className="app-label">
                                    {singleMessage?.mobile} - {singleMessage?.name}
                                </label>
                                <label className="app-label">
                                    {singleMessage?.message}
                                </label>
                                {
                                    singleMessage?.status == 'new' ?
                                        <div className="w-100">
                                            {
                                                user_type === "ADM" || isCanUpdate ?

                                                    <Card.Body className="p-0 m-0 ">
                                                        <Form
                                                            onSubmit={(e) =>
                                                                adminNote ?
                                                                    handleReplyMessage(e) :
                                                                    toast.error('يجب كتابة ملاحظات الادارة')
                                                            }
                                                        >


                                                            <Form.Group
                                                                className='text-start form-group'
                                                                controlId='formpassword'
                                                            >
                                                                <Form.Label>  ملاحظات داخلية للادارة</Form.Label>
                                                                <textarea
                                                                    className='form-control'
                                                                    value={adminNote}
                                                                    onChange={(e) => setAdminNote(e.target.value)}
                                                                    rows={5}
                                                                    placeholder=' ملاحظات  المشرف'
                                                                    required
                                                                />
                                                            </Form.Group>
                                                            <Form.Group
                                                                className='text-start form-group'
                                                                controlId='formpassword'
                                                            >
                                                                <Form.Label>  رسالة الرد التي تصل إلى العميل</Form.Label>
                                                                <textarea
                                                                    className='form-control'
                                                                    value={reply}
                                                                    onChange={(e) => setReply(e.target.value)}
                                                                    rows={5}
                                                                    placeholder=' رسالة الرد التي تصل إلى العميل'
                                                                />
                                                            </Form.Group>

                                                            <Button
                                                                disabled={loading}
                                                                type='submit'
                                                                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
                                                            >
                                                                {loading ? "جار الإرسال..." : "  إرسال الرد"}
                                                            </Button>


                                                        </Form>
                                                    </Card.Body>
                                                    : ''
                                            }

                                        </div>
                                        :
                                        <div className="w-100">




                                            <Form.Group
                                                className='text-start form-group'
                                                controlId='formpassword'
                                            >
                                                <Form.Label>  ملاحظات داخلية للادارة : </Form.Label>
                                               <span>{singleMessage?.admin_notes}</span>
                                            </Form.Group>
                                            <Form.Group
                                                className='text-start form-group'
                                                controlId='formpassword'
                                            >
                                                <Form.Label>  رسالة الرد التي تصل إلى العميل : </Form.Label>
                                                <span>{singleMessage?.response}</span>
                                            </Form.Group>





                                        </div>

                                }
                            </div>
                        )}
                    </Col>
                </Row>
            </div >
        </>
    );
};

Page.layout = "Contentlayout";

export default Page;
