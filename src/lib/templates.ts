/**
 * Custom Report Template Management
 * カスタムレポートテンプレートの管理機能
 */

export interface TemplateSection {
  id: string;
  templateId: string;
  title: string;
  contentType: 'text' | 'table' | 'chart' | 'image' | 'calculation';
  content: string;
  displayOrder: number;
  isVisible: boolean;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: 'property_analysis' | 'market_analysis' | 'investment_simulation' | 'area_analysis' | 'custom';
  isDefault: boolean;
  isPublic: boolean;
  sections?: TemplateSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateParams {
  userId: string;
  name: string;
  description?: string;
  category: ReportTemplate['category'];
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface CreateSectionParams {
  templateId: string;
  title: string;
  contentType: TemplateSection['contentType'];
  content: string;
  displayOrder: number;
  isVisible?: boolean;
  config?: Record<string, any>;
}

export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  category?: ReportTemplate['category'];
  isDefault?: boolean;
  isPublic?: boolean;
}

export interface UpdateSectionParams {
  title?: string;
  contentType?: TemplateSection['contentType'];
  content?: string;
  displayOrder?: number;
  isVisible?: boolean;
  config?: Record<string, any>;
}

/**
 * Generate unique ID for template
 */
function generateTemplateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique ID for section
 */
function generateSectionId(): string {
  return `sec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new report template
 */
export async function createTemplate(
  db: D1Database,
  params: CreateTemplateParams
): Promise<ReportTemplate> {
  const templateId = generateTemplateId();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO report_templates (
      id, user_id, name, description, category,
      is_default, is_public, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    templateId,
    params.userId,
    params.name,
    params.description || null,
    params.category,
    params.isDefault ? 1 : 0,
    params.isPublic ? 1 : 0,
    now,
    now
  ).run();

  const template = await db.prepare(`
    SELECT * FROM report_templates WHERE id = ?
  `).bind(templateId).first();

  return mapTemplate(template);
}

/**
 * Get template by ID
 */
export async function getTemplate(
  db: D1Database,
  templateId: string
): Promise<ReportTemplate | null> {
  const template = await db.prepare(`
    SELECT * FROM report_templates WHERE id = ?
  `).bind(templateId).first();

  if (!template) {
    return null;
  }

  // Get sections
  const sectionsResult = await db.prepare(`
    SELECT * FROM template_sections 
    WHERE template_id = ? 
    ORDER BY display_order ASC
  `).bind(templateId).all();

  const templateData = mapTemplate(template);
  templateData.sections = sectionsResult.results.map(mapSection);

  return templateData;
}

/**
 * Get all templates for a user
 */
export async function getUserTemplates(
  db: D1Database,
  userId: string
): Promise<ReportTemplate[]> {
  const result = await db.prepare(`
    SELECT * FROM report_templates 
    WHERE user_id = ? OR is_public = 1
    ORDER BY created_at DESC
  `).bind(userId).all();

  return result.results.map(mapTemplate);
}

/**
 * Get templates by category
 */
export async function getTemplatesByCategory(
  db: D1Database,
  userId: string,
  category: ReportTemplate['category']
): Promise<ReportTemplate[]> {
  const result = await db.prepare(`
    SELECT * FROM report_templates 
    WHERE (user_id = ? OR is_public = 1) AND category = ?
    ORDER BY created_at DESC
  `).bind(userId, category).all();

  return result.results.map(mapTemplate);
}

/**
 * Update template
 */
export async function updateTemplate(
  db: D1Database,
  templateId: string,
  params: UpdateTemplateParams
): Promise<ReportTemplate | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.name !== undefined) {
    updates.push('name = ?');
    values.push(params.name);
  }
  if (params.description !== undefined) {
    updates.push('description = ?');
    values.push(params.description);
  }
  if (params.category !== undefined) {
    updates.push('category = ?');
    values.push(params.category);
  }
  if (params.isDefault !== undefined) {
    updates.push('is_default = ?');
    values.push(params.isDefault ? 1 : 0);
  }
  if (params.isPublic !== undefined) {
    updates.push('is_public = ?');
    values.push(params.isPublic ? 1 : 0);
  }

  if (updates.length === 0) {
    return getTemplate(db, templateId);
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(templateId);

  await db.prepare(`
    UPDATE report_templates 
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...values).run();

  return getTemplate(db, templateId);
}

/**
 * Delete template
 */
export async function deleteTemplate(
  db: D1Database,
  templateId: string
): Promise<void> {
  // Delete sections first (foreign key constraint)
  await db.prepare(`
    DELETE FROM template_sections WHERE template_id = ?
  `).bind(templateId).run();

  // Delete template
  await db.prepare(`
    DELETE FROM report_templates WHERE id = ?
  `).bind(templateId).run();
}

/**
 * Create a template section
 */
export async function createSection(
  db: D1Database,
  params: CreateSectionParams
): Promise<TemplateSection> {
  const sectionId = generateSectionId();
  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO template_sections (
      id, template_id, title, content_type, content,
      display_order, is_visible, config, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    sectionId,
    params.templateId,
    params.title,
    params.contentType,
    params.content,
    params.displayOrder,
    params.isVisible !== false ? 1 : 0,
    params.config ? JSON.stringify(params.config) : null,
    now,
    now
  ).run();

  const section = await db.prepare(`
    SELECT * FROM template_sections WHERE id = ?
  `).bind(sectionId).first();

  return mapSection(section);
}

/**
 * Update a template section
 */
export async function updateSection(
  db: D1Database,
  sectionId: string,
  params: UpdateSectionParams
): Promise<TemplateSection | null> {
  const updates: string[] = [];
  const values: any[] = [];

  if (params.title !== undefined) {
    updates.push('title = ?');
    values.push(params.title);
  }
  if (params.contentType !== undefined) {
    updates.push('content_type = ?');
    values.push(params.contentType);
  }
  if (params.content !== undefined) {
    updates.push('content = ?');
    values.push(params.content);
  }
  if (params.displayOrder !== undefined) {
    updates.push('display_order = ?');
    values.push(params.displayOrder);
  }
  if (params.isVisible !== undefined) {
    updates.push('is_visible = ?');
    values.push(params.isVisible ? 1 : 0);
  }
  if (params.config !== undefined) {
    updates.push('config = ?');
    values.push(JSON.stringify(params.config));
  }

  if (updates.length === 0) {
    const section = await db.prepare(`
      SELECT * FROM template_sections WHERE id = ?
    `).bind(sectionId).first();
    return section ? mapSection(section) : null;
  }

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(sectionId);

  await db.prepare(`
    UPDATE template_sections 
    SET ${updates.join(', ')}
    WHERE id = ?
  `).bind(...values).run();

  const section = await db.prepare(`
    SELECT * FROM template_sections WHERE id = ?
  `).bind(sectionId).first();

  return section ? mapSection(section) : null;
}

/**
 * Delete a template section
 */
export async function deleteSection(
  db: D1Database,
  sectionId: string
): Promise<void> {
  await db.prepare(`
    DELETE FROM template_sections WHERE id = ?
  `).bind(sectionId).run();
}

/**
 * Get sections for a template
 */
export async function getTemplateSections(
  db: D1Database,
  templateId: string
): Promise<TemplateSection[]> {
  const result = await db.prepare(`
    SELECT * FROM template_sections 
    WHERE template_id = ? 
    ORDER BY display_order ASC
  `).bind(templateId).all();

  return result.results.map(mapSection);
}

/**
 * Duplicate a template (copy)
 */
export async function duplicateTemplate(
  db: D1Database,
  templateId: string,
  userId: string,
  newName: string
): Promise<ReportTemplate> {
  // Get original template with sections
  const original = await getTemplate(db, templateId);
  if (!original) {
    throw new Error('Template not found');
  }

  // Create new template
  const newTemplate = await createTemplate(db, {
    userId,
    name: newName,
    description: original.description,
    category: original.category,
    isDefault: false,
    isPublic: false,
  });

  // Copy sections
  if (original.sections) {
    for (const section of original.sections) {
      await createSection(db, {
        templateId: newTemplate.id,
        title: section.title,
        contentType: section.contentType,
        content: section.content,
        displayOrder: section.displayOrder,
        isVisible: section.isVisible,
        config: section.config,
      });
    }
  }

  // Return new template with sections
  return getTemplate(db, newTemplate.id) as Promise<ReportTemplate>;
}

/**
 * Map database row to ReportTemplate
 */
function mapTemplate(row: any): ReportTemplate {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    category: row.category,
    isDefault: Boolean(row.is_default),
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map database row to TemplateSection
 */
function mapSection(row: any): TemplateSection {
  return {
    id: row.id,
    templateId: row.template_id,
    title: row.title,
    contentType: row.content_type,
    content: row.content,
    displayOrder: row.display_order,
    isVisible: Boolean(row.is_visible),
    config: row.config ? JSON.parse(row.config) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get public templates (available to all users)
 */
export async function getPublicTemplates(
  db: D1Database
): Promise<ReportTemplate[]> {
  const result = await db.prepare(`
    SELECT * FROM report_templates 
    WHERE is_public = 1
    ORDER BY created_at DESC
  `).all();

  return result.results.map(mapTemplate);
}

/**
 * Set template as default for a category
 */
export async function setDefaultTemplate(
  db: D1Database,
  templateId: string,
  userId: string
): Promise<void> {
  // Get template to find its category
  const template = await getTemplate(db, templateId);
  if (!template || template.userId !== userId) {
    throw new Error('Template not found or unauthorized');
  }

  // Unset other defaults in this category for this user
  await db.prepare(`
    UPDATE report_templates 
    SET is_default = 0 
    WHERE user_id = ? AND category = ? AND is_default = 1
  `).bind(userId, template.category).run();

  // Set this template as default
  await db.prepare(`
    UPDATE report_templates 
    SET is_default = 1, updated_at = ?
    WHERE id = ?
  `).bind(new Date().toISOString(), templateId).run();
}

/**
 * Get default template for a category
 */
export async function getDefaultTemplate(
  db: D1Database,
  userId: string,
  category: ReportTemplate['category']
): Promise<ReportTemplate | null> {
  const template = await db.prepare(`
    SELECT * FROM report_templates 
    WHERE user_id = ? AND category = ? AND is_default = 1
    LIMIT 1
  `).bind(userId, category).first();

  if (!template) {
    return null;
  }

  return getTemplate(db, template.id);
}
