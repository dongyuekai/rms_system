import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Card, Row, Col, Modal, Button, message, Drawer, List, Tag, Badge } from 'antd';
import { UserOutlined, LogoutOutlined, MedicineBoxOutlined, BellOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import './Dashboard.css';

const { Header, Sider, Content } = Layout;

function Dashboard() {
  const { user, logout } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return; // 添加用户检查

    fetchDepartments();
    fetchMyAppointments();

    // 初始化WebSocket
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('doctorUpdate', ({ doctorId }) => {
      // 实时更新医生列表
      if (selectedDepartment) {
        fetchDoctors(selectedDepartment);
      }
    });

    newSocket.on('appointmentUpdate', ({ userId, message: msg }) => {
      // 确保用户ID匹配（处理字符串比较）
      if (userId === user._id || userId === user.id) {
        message.success(msg);
        // 实时更新挂号记录和医生列表
        fetchMyAppointments();
        if (selectedDepartment) {
          fetchDoctors(selectedDepartment);
        }
      }
    });

    return () => newSocket.close();
  }, [user, selectedDepartment]); // 重新添加selectedDepartment依赖

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
      if (response.data.length > 0 && !selectedDepartment) {
        // 只在没有选中科室时设置默认选中
        const firstDeptId = response.data[0]._id;
        setSelectedDepartment(firstDeptId);
        fetchDoctors(firstDeptId);
      }
    } catch (error) {
      message.error('获取科室信息失败');
    }
  };

  const fetchDoctors = async (departmentId) => {
    try {
      const response = await axios.get(`/api/doctors/department/${departmentId}`);
      setDoctors(response.data);
    } catch (error) {
      message.error('获取医生信息失败');
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/my');
      setMyAppointments(response.data);
    } catch (error) {
      console.error('获取挂号记录失败');
    }
  };

  const handleDepartmentClick = (departmentId) => {
    setSelectedDepartment(departmentId);
    fetchDoctors(departmentId);
  };

  const handleDoctorClick = (doctor) => {
    setSelectedDoctor(doctor);
    setModalVisible(true);
  };

  const handleAppointment = async () => {
    try {
      const response = await axios.post('/api/appointments', { doctorId: selectedDoctor._id });
      message.success(response.data.message);
      setModalVisible(false);
      fetchDoctors(selectedDepartment);
      fetchMyAppointments();
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleCancelAppointment = async (doctorId) => {
    try {
      await axios.delete(`/api/appointments/${doctorId || selectedDoctor._id}`);
      message.success('取消成功');
      setModalVisible(false);
      setDrawerVisible(false);
      fetchDoctors(selectedDepartment);
      fetchMyAppointments();
    } catch (error) {
      message.error(error.response?.data?.message || '取消失败');
    }
  };

  const getAppointmentStatus = (doctor) => {
    if (!doctor || !myAppointments.length) return null; // 添加检查
    const appointment = myAppointments.find(apt => apt.doctor._id === doctor._id);
    return appointment?.status || null;
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="appointments" icon={<BellOutlined />} onClick={() => setDrawerVisible(true)}>
        我的挂号
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const renderModalFooter = () => {
    if (!selectedDoctor) return []; // 添加检查

    const status = getAppointmentStatus(selectedDoctor);
    const isFull = selectedDoctor.bookedSlots >= selectedDoctor.totalSlots;

    if (status === 'active') {
      return [
        <Button key="cancel" danger onClick={() => handleCancelAppointment()}>
          取消挂号
        </Button>
      ];
    } else if (status === 'waiting') {
      return [
        <Button key="cancel" danger onClick={() => handleCancelAppointment()}>
          取消候补
        </Button>
      ];
    } else if (isFull) {
      return [
        <Button key="waiting" type="primary" onClick={handleAppointment}>
          候补
        </Button>
      ];
    } else {
      return [
        <Button key="book" type="primary" onClick={handleAppointment}>
          挂号
        </Button>
      ];
    }
  };

  // 如果用户未登录，显示加载状态
  if (!user) {
    return <div>加载中...</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header">
        <div className="header-left">
          <MedicineBoxOutlined style={{ fontSize: '24px', marginRight: '8px' }} />
          <span className="system-title">挂号管理系统</span>
        </div>
        <div className="header-right">
          <Badge count={myAppointments.length} offset={[10, 0]}>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <div className="user-info">
                <Avatar src={user.avatar} icon={<UserOutlined />} />
                <span className="username">{user.name}</span>
              </div>
            </Dropdown>
          </Badge>
        </div>
      </Header>

      <Layout>
        <Sider width={200} className="site-layout-background" breakpoint="lg" collapsedWidth="0">
          <Menu
            mode="inline"
            selectedKeys={selectedDepartment ? [selectedDepartment] : []}
            style={{ height: '100%', borderRight: 0 }}
          >
            {departments.map(dept => (
              <Menu.Item
                key={dept._id}
                onClick={() => handleDepartmentClick(dept._id)}
              >
                {dept.name}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <Layout style={{ padding: '24px' }}>
          <Content>
            <Row gutter={[16, 16]}>
              {doctors.map(doctor => {
                const status = getAppointmentStatus(doctor);
                const isFull = doctor.bookedSlots >= doctor.totalSlots;

                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={doctor._id}>
                    <Card
                      hoverable
                      className="doctor-card"
                      onClick={() => handleDoctorClick(doctor)}
                      cover={
                        <div className="doctor-avatar-container">
                          <Avatar size={80} src={doctor.avatar} icon={<UserOutlined />} />
                          {status && (
                            <Tag
                              color={status === 'active' ? 'green' : 'orange'}
                              className="status-tag"
                            >
                              {status === 'active' ? '已挂号' : '候补中'}
                            </Tag>
                          )}
                        </div>
                      }
                    >
                      <Card.Meta
                        title={doctor.name}
                        description={
                          <div>
                            <p>科室: {doctor.department.name}</p>
                            <p>出诊时间: {doctor.schedule}</p>
                            <p>时段: {doctor.period}</p>
                            <p>费用: ¥{doctor.fee}</p>
                            <p className={`booking-status ${isFull ? 'full' : ''}`}>
                              挂号情况: {doctor.bookedSlots}/{doctor.totalSlots}
                              {isFull && <span className="full-text"> (已满)</span>}
                            </p>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="医生信息"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={renderModalFooter()}
      >
        {selectedDoctor && (
          <div className="doctor-modal-content">
            <div className="doctor-info">
              <Avatar size={100} src={selectedDoctor.avatar} icon={<UserOutlined />} />
              <div className="doctor-details">
                <h3>{selectedDoctor.name}</h3>
                <p>科室: {selectedDoctor.department.name}</p>
                <p>出诊时间: {selectedDoctor.schedule}</p>
                <p>时段: {selectedDoctor.period}</p>
                <p>费用: ¥{selectedDoctor.fee}</p>
                <p>挂号情况: {selectedDoctor.bookedSlots}/{selectedDoctor.totalSlots}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Drawer
        title="我的挂号记录"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        <List
          dataSource={myAppointments}
          renderItem={(appointment) => (
            <List.Item
              actions={[
                <Button
                  key="cancel"
                  danger
                  size="small"
                  onClick={() => handleCancelAppointment(appointment.doctor._id)}
                >
                  {appointment.status === 'active' ? '取消挂号' : '取消候补'}
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar src={appointment.doctor.avatar} icon={<UserOutlined />} />}
                title={appointment.doctor.name}
                description={
                  <div>
                    <p>{appointment.doctor.department.name}</p>
                    <p>{appointment.doctor.schedule} {appointment.doctor.period}</p>
                    <Tag color={appointment.status === 'active' ? 'green' : 'orange'}>
                      {appointment.status === 'active' ? '已挂号' : `候补中 (第${appointment.queuePosition}位)`}
                    </Tag>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </Layout>
  );
}

export default Dashboard;
