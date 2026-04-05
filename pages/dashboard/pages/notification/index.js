import React, { useEffect, useReducer, useState } from 'react';
import dynamic from 'next/dynamic';
import PageHeader from '../../../../shared/layout-components/page-header/page-header';
import {
    Button,
    Card,
    Col,
    Form,
    OverlayTrigger,
    Row,
    Tooltip,
} from 'react-bootstrap';
const DataTable = dynamic(() => import('react-data-table-component'), {
    ssr: false,
});
const DataTableExtensions = dynamic(
    () => import('react-data-table-component-extensions'),
    { ssr: false }
);
import 'react-data-table-component-extensions/dist/index.css';
import Seo from '../../../../shared/layout-components/seo/seo';
import Link from 'next/link';
import { toast } from 'react-toastify';
// images
import * as XLSX from 'xlsx';
import { getUserCookies } from '../../../../utils/getUserCookies';

const user = getUserCookies();

const Notification = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState();
    const [selectedUser, setSelectedUser] = useState([]);
    const [selectedType, setSelectedType] = useState(null);
  
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const { token, id, user_type } = user;

    const types = [
        {
            value: 'ALL',
            label: 'كل المستخدمين',
        },
        {
            value: 'HAVE_PURCHASES',
            label: 'لديهم شراء',
        },
        {
            value: 'HAVE_NO_PURCHASES',
            label: ' ليس لديهم شراء',
        },
        {
            value: 'COMPLETED_PROFILE',
            label: ' أكملوا بياناتهم ',
        },

    ];

    const addNotification = async (e, data) => {
        e.preventDefault();
        setLoading(true);

        const {

            to_whom,
            message,

        } = data;
        console.log(selectedUser);

        const fd = new FormData();
        fd.append('title', message);
        fd.append('to_whom', to_whom)

        if (to_whom && message) {
            const res = await fetch(`${baseUrl}/api/v1/notifications/`, {
                method:  'POST' ,
                body: fd,
                headers: {
                    Authorization: ` ${token}`,
                },
            });

            const result = await res.json();

            if (res.ok) {
                toast.success(result?.message);
                setMessage('')
              
                setSelectedType(null);
            
            } else {
                setLoading(false);
                toast.error(result.message || 'حدث خطأ ما');
            }

            setLoading(false);
            e.target.reset();
        } else {
            setLoading(false);
            toast.error('  يجب اختيار   نوع المستخدمين وكتابة الرسالة');
        }
        setLoading(false);
    };

  


    return (
        <>
            <Seo title="الاشعارات" />

            <PageHeader
                title="الاشعارات"
                item=" شركة وحيد "
                active_item="ارسال اشعار"
            />

            <div>
                {/* <!-- Row --> */}
                <Row className="row-sm">
                    <Col md={12} lg={12}>
                        <Card className=" ">
                          
                            <Card.Body>
                                <div
                                 
                                    className="  w-100  d-flex justify-content-center align-items-center"
                                >
                                    <Card
                                        style={{
                                            width: '50%',
                                            minWidth: '320px',
                                            maxWidth: '600px',

                                        }}
                                    >
                                        <Card.Header>
                                            <h3> ارسال اشعار جديد</h3>
                                        </Card.Header>
                                        <Card.Body>
                                            <Form
                                                onSubmit={e =>
                                                    addNotification(e, {

                                                        to_whom: selectedType,
                                                        message,

                                                    })
                                                }
                                            >
                                                <Form.Group
                                                    className="text-start form-group"
                                                    controlId="formPackage"
                                                >
                                                    <Form.Label>  نوع المستخدمين </Form.Label>
                                                    <Form.Select
                                                        className="form-control ps-5 text-muted"
                                                        name="categories"
                                                        value={selectedType}
                                                        onChange={e => setSelectedType(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">اختر ...</option>
                                                        {types.map(type => (
                                                            <option key={type.value} value={type.value}>
                                                                {type.label}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>

                                                <Form.Group
                                                    className="text-start form-group"
                                                    controlId="formpassword"
                                                >
                                                    <Form.Label> نص الرسالة</Form.Label>
                                                    <textarea
                                                        className="form-control"
                                                        value={message}
                                                        onChange={e => setMessage(e.target.value)}
                                                        rows={5}
                                                        placeholder="ادخل النص"
                                                    />
                                                </Form.Group>
                                            



                                                <div className="d-flex gap-4">
                                                    <Button
                                                        disabled={loading}
                                                        type="submit"
                                                        className="btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 "
                                                    >
                                                        {loading ? 'جار الارسال...' : 'ارسال الاشعار'}
                                                    </Button>
                                                
                                                </div>
                                            </Form>
                                        </Card.Body>
                                    </Card>
                                </div>

                         
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {/* <!-- End Row --> */}
            </div>

        </>
    );
};

Notification.layout = 'Contentlayout';

export default Notification;
