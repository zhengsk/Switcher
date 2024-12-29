import { useEffect, useState } from "react"
import { Button, Input, Form, Card, message, Popconfirm, Modal, Select, Space } from "antd"
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons"
import type { SiteConfig } from "@/src/types/site"
import styles from '@/src/styles/options.module.less'
import logo from "data-base64:../assets/icon.png"

function OptionsPage() {
  const [sites, setSites] = useState<SiteConfig[]>([])
  const [editingSite, setEditingSite] = useState<SiteConfig | null>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()

  useEffect(() => {
    const loadSites = async () => {
      try {
        console.log('Loading sites...')
        const result = await chrome.storage.local.get("siteConfigs")
        console.log('Loaded sites:', result.siteConfigs)
        if (result.siteConfigs) {
          setSites(result.siteConfigs)
        }
      } catch (error) {
        messageApi.error("加载配置失败")
        console.error('Load error:', error)
      }
    }

    loadSites()
  }, [])

  const textToObject = (text: string): Record<string, string> => {
    if (!text) return {}
    return text.split('\n')
      .filter(line => line.trim())
      .reduce((acc, line) => {
        const [key, value] = line.split('=').map(s => s.trim())
        if (key && value) acc[key] = value
        return acc
      }, {} as Record<string, string>)
  }

  const objectToText = (obj: Record<string, string> = {}): string => {
    return Object.entries(obj)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  }

  useEffect(() => {
    if (editingSite) {
      console.log('Setting form values:', editingSite)
      form.setFieldsValue({
        ...editingSite,
        extraFields: objectToText(editingSite.extraFields || {}),
        headers: objectToText(editingSite.headers || {})
      })
    } else {
      form.resetFields()
    }
  }, [editingSite, form])

  const handleAddSite = () => {
    form.resetFields()
    setEditingSite({
      name: '',
      domain: '',
      loginUrl: '',
      method: 'POST',
      usernameField: '',
      passwordField: '',
      extraFields: {},
      headers: {}
    })
  }

  const handleSaveSite = async (values: any) => {
    try {
      const extraFields = values.extraFields ? textToObject(values.extraFields) : {}
      const headers = values.headers ? textToObject(values.headers) : {}

      const newSite: SiteConfig = {
        ...values,
        id: editingSite?.id || Date.now().toString(),
        extraFields,
        headers
      }

      console.log('Saving site:', newSite)

      const updatedSites = editingSite?.id
        ? sites.map(site => site.id === editingSite.id ? newSite : site)
        : [...sites, { ...newSite, id: Date.now().toString() }]

      await chrome.storage.local.set({ siteConfigs: updatedSites })
      setSites(updatedSites)
      setEditingSite(null)
      form.resetFields()
      messageApi.success("保存成功")

      const result = await chrome.storage.local.get("siteConfigs")
      console.log('Saved sites:', result.siteConfigs)
    } catch (error) {
      messageApi.error("保存失败")
      console.error('Save error:', error)
    }
  }

  const handleDeleteSite = async (id: string) => {
    try {
      const updatedSites = sites.filter(site => site.id !== id)
      await chrome.storage.local.set({ siteConfigs: updatedSites })
      setSites(updatedSites)
      messageApi.success("删除成功")
    } catch (error) {
      messageApi.error("删除失败")
      console.error(error)
    }
  }

  useEffect(() => {
    return () => {
      form.resetFields()
    }
  }, [form])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} alt="Logo" className={styles.logo} />
        <h1 className={styles.title}>Switcher 站点配置</h1>
      </div>
      {contextHolder}
      <Card
        title="站点配置"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSite}
          >
            添加站点
          </Button>
        }
      >
        <div className={styles.siteList}>
          {sites.map(site => (
            <Card
              key={site.id}
              size="small"
              className={styles.siteCard}
              actions={[
                <EditOutlined key="edit" onClick={() => setEditingSite(site)} />,
                <Popconfirm
                  key="delete"
                  title="确定要删除此站点配置吗？"
                  onConfirm={() => handleDeleteSite(site.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <DeleteOutlined />
                </Popconfirm>
              ]}
            >
              <Card.Meta
                title={site.name}
                description={
                  <Space direction="vertical" size={1} style={{ width: '100%' }}>
                    <div>域名：{site.domain}</div>
                    <div>登录地址：{site.loginUrl}</div>
                    <div>请求方法：{site.method}</div>
                    <div>用户名字段：{site.usernameField}</div>
                    <div>密码字段：{site.passwordField}</div>
                    {Object.keys(site.extraFields || {}).length > 0 && (
                      <div>
                        额外字段：
                        {Object.entries(site.extraFields || {}).map(([key, value]) => (
                          <div key={key} style={{ paddingLeft: 8 }}>
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    )}
                    {Object.keys(site.headers || {}).length > 0 && (
                      <div>
                        请求头：
                        {Object.entries(site.headers || {}).map(([key, value]) => (
                          <div key={key} style={{ paddingLeft: 8 }}>
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </Space>
                }
              />
            </Card>
          ))}
        </div>
      </Card>

      <Modal
        title={editingSite?.id ? "编辑站点" : "添加站点"}
        open={!!editingSite}
        onOk={() => form.submit()}
        onCancel={() => setEditingSite(null)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editingSite || {}}
          onFinish={handleSaveSite}
        >
          <Form.Item
            label="站点名称"
            name="name"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="例如：花瓣网" />
          </Form.Item>

          <Form.Item
            label="域名"
            name="domain"
            rules={[{ required: true, message: '请输入域名' }]}
          >
            <Input placeholder="例如：huaban.com" />
          </Form.Item>

          <Form.Item
            label="登录接口地址"
            name="loginUrl"
            rules={[{ required: true, message: '请输入登录接口地址' }]}
          >
            <Input placeholder="例如：/v3/auth/" />
          </Form.Item>

          <Form.Item
            label="请求方法"
            name="method"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="GET">GET</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="用户名字段"
            name="usernameField"
            rules={[{ required: true, message: '请输入用户名字段名' }]}
          >
            <Input placeholder="例如：username" />
          </Form.Item>

          <Form.Item
            label="密码字段"
            name="passwordField"
            rules={[{ required: true, message: '请输入密码字段名' }]}
          >
            <Input placeholder="例如：password" />
          </Form.Item>

          <Form.Item
            label="额外字段"
            name="extraFields"
          >
            <Input.TextArea
              placeholder="每行一个字段，格式：字段名=字段值"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label="请求头"
            name="headers"
          >
            <Input.TextArea
              placeholder="每行一个请求头，格式：Header-Name=header-value"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OptionsPage 